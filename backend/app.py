import streamlit as st
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

# ---------------------------
# Load Environment Variables
# ---------------------------
load_dotenv()

# ---------------------------
# CONFIG
# ---------------------------
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "RAG_AGRI"

# Groq API Configuration (Free tier available at https://console.groq.com/)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    st.error("GROQ_API_KEY not found in environment variables")
    st.stop()
    
os.environ["OPENAI_API_KEY"] = GROQ_API_KEY

# ---------------------------
# Page Config
# ---------------------------
st.set_page_config(
    page_title="Agriculture RAG Chatbot",
    page_icon="🌾",
    layout="wide"
)

# ---------------------------
# Initialize Models (with caching)
# ---------------------------
@st.cache_resource
def load_models():
    """Load and cache the embedding model, Qdrant client, and LLM"""
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=120.0  # Increased timeout to 120 seconds for slow connections
    )
    
    llm = ChatOpenAI(
        model="llama-3.3-70b-versatile",
        base_url="https://api.groq.com/openai/v1",
        api_key=GROQ_API_KEY,
        temperature=0.3,
        request_timeout=120.0,
        max_retries=2
    )
    
    return embedding_model, client, llm

# Load models
try:
    embedding_model, client, llm = load_models()
    models_loaded = True
except Exception as e:
    st.error(f"Error loading models: {e}")
    models_loaded = False

# ---------------------------
# RAG Function
# ---------------------------
def retrieve_and_generate(query: str, k: int = 3):
    """Retrieve relevant documents and generate a response using Groq"""
    status = st.empty()
    
    try:
        # 0. Translate Query if needed (Optimized for Tamil/Multilingual)
        status.info("🌍 Analyzing language...")
        
        # Simple heuristic: If query has non-ascii, translate it
        search_query = query
        if not query.isascii():
            try:
                translation_prompt = f"Translate the following text to English. Output ONLY the translation, nothing else.\n\nText: {query}"
                translation_response = llm.invoke(translation_prompt)
                search_query = translation_response.content.strip()
                status.info(f"🔄 Translated for search: '{search_query}'")
            except Exception as e:
                # Fallback to original if translation fails
                print(f"Translation failed: {e}")
                pass

        # 1. Embed the query (using English translation)
        status.info("🧠 Processing your question...")
        query_vector = embedding_model.encode(search_query).tolist()
        
        # 2. Search in Qdrant
        status.info("🔍 Searching agriculture database...")
        try:
            from qdrant_client.models import QueryRequest, VectorParams as VP
            search_results = client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=k
            ).points
        except Exception as e:
            raise Exception(f"Database Connection Error: {str(e)}")
        
        if not search_results:
            status.empty()
            return {
                "answer": "I am sorry, but I couldn't find any relevant information in my agriculture database to answer your question.",
                "sources": []
            }
        
        # Extract context from results
        context_parts = []
        for i, result in enumerate(search_results):
            context_parts.append(f"Document {i+1}:\n{result.payload['text']}\n")
        
        context = "\n".join(context_parts)
        
        # 3. Generate response with LLM
        status.info("🤖 Generating answer...")
        
        # Create prompt
        prompt = f"""You are a specialized agricultural assistant. You must answer questions ONLY based on the provided Context below.
    
Context:
{context}

User Question: {query}
(Search Context used: {search_query})

Instructions:
1. Answer the User Question STRICTLY using only the information from the Context above.
2. **IMPORTANT**: Answer in the SAME LANGUAGE as the User Question. (If the user asks in Tamil, answer in Tamil).
3. If the question is not related to the crops, diseases, or agricultural information in the Context, or if the Context doesn't contain the answer, you MUST say (in the user's language): "I am sorry, but I can only answer questions related to agriculture, crops, and diseases present in my database."
4. Do NOT make up information or use outside knowledge.

Answer:"""
        
        try:
            response = llm.invoke(prompt)
        except Exception as e:
            raise Exception(f"AI Model Error: {str(e)}")
        
        status.empty()
        return {
            "answer": response.content,
            "sources": [
                {
                    "crop": result.payload.get("crop"),
                    "disease": result.payload.get("disease"),
                    "category": result.payload.get("category"),
                    "score": result.score
                }
                for result in search_results
            ]
        }

    except Exception as e:
        status.empty()
        raise e

# ---------------------------
# UI
# ---------------------------
st.title("🌾 Agriculture RAG Chatbot")
st.markdown("Ask questions about crops, diseases, symptoms, treatments, and prevention methods!")

# Sidebar
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    This chatbot uses:
    - **Qdrant** for vector search
    - **Groq (Llama 3.3)** for generating responses
    - **Sentence Transformers** for embeddings
    
    Ask questions like:
    - "What are the symptoms of tomato blight?"
    - "How do I treat potato diseases?"
    - "Prevention methods for rice diseases?"
    """)
    
    st.divider()
    
    num_results = st.slider("Number of sources to retrieve", 1, 5, 3)

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message:
            with st.expander("📚 View Sources"):
                for i, source in enumerate(message["sources"], 1):
                    st.markdown(f"""
                    **Source {i}** (Relevance: {source['score']:.2f})
                    - **Crop:** {source['crop']}
                    - **Disease:** {source['disease']}
                    - **Category:** {source['category']}
                    """)

# Chat input
if prompt := st.chat_input("Ask about crops, diseases, treatments..."):
    if not models_loaded:
        st.error("Models not loaded. Please check your configuration.")
    else:
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    result = retrieve_and_generate(prompt, k=num_results)
                    
                    # Display response
                    st.markdown(result["answer"])
                    
                    # Display sources
                    with st.expander("📚 View Sources"):
                        for i, source in enumerate(result["sources"], 1):
                            st.markdown(f"""
                            **Source {i}** (Relevance: {source['score']:.2f})
                            - **Crop:** {source['crop']}
                            - **Disease:** {source['disease']}
                            - **Category:** {source['category']}
                            """)
                    
                    # Add assistant response to chat history
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": result["answer"],
                        "sources": result["sources"]
                    })
                    
                except Exception as e:
                    st.error(f"Error: {e}")

# Clear chat button
if st.sidebar.button("🗑️ Clear Chat History"):
    st.session_state.messages = []
    st.rerun()
