"""Quick test to check if Qdrant search + Groq are working for multiple queries."""
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os, time

# Load env vars
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")
    
os.environ["OPENAI_API_KEY"] = GROQ_API_KEY

model = SentenceTransformer("all-MiniLM-L6-v2")
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=120.0)
llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY,
    temperature=0.3,
    request_timeout=120.0,
)

queries = [
    "What are the symptoms of early blight in tomato?",
    "How to treat late blight in potato?",
    "How to prevent powdery mildew in grapes?",
]

for q in queries:
    print(f"\n{'='*60}")
    print(f"QUERY: {q}")
    
    # 1. Search Qdrant
    vec = model.encode(q).tolist()
    results = client.query_points(collection_name="RAG_AGRI", query=vec, limit=3).points
    print(f"  Qdrant results: {len(results)}")
    for r in results:
        crop = r.payload.get("crop", "?")
        disease = r.payload.get("disease", "?")
        print(f"    Score={r.score:.3f} | {crop} / {disease}")
        text_preview = r.payload.get("text", "")[:150].replace("\n", " ")
        print(f"    Text: {text_preview}...")
    
    # 2. Call LLM
    try:
        context = "\n".join([f"Doc {i+1}: {r.payload.get('text','')}" for i, r in enumerate(results)])
        prompt = f"Based on this context, answer briefly:\n\nContext:\n{context}\n\nQuestion: {q}\n\nAnswer:"
        response = llm.invoke(prompt)
        print(f"  LLM answer: {response.content[:200]}...")
    except Exception as e:
        print(f"  LLM ERROR: {e}")
    
    # Wait to avoid rate limits
    time.sleep(3)
