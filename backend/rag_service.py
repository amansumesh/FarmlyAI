"""
RAG Service - Flask API wrapper for the Agriculture RAG pipeline.
Exposes the Qdrant + Groq/Llama RAG logic as a REST API for the Node.js backend.
"""

from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client import QdrantClient
from langchain_openai import ChatOpenAI
from groq import Groq
from dotenv import load_dotenv
import os
import time
import tempfile
import logging

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

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

os.environ["OPENAI_API_KEY"] = GROQ_API_KEY

PORT = int(os.getenv("PORT", 5001))

# ---------------------------
# Logging
# ---------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------
# Flask App
# ---------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------
# Load Models
# ---------------------------
logger.info("Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# logger.info("Connecting to Qdrant...")
# qdrant_client = QdrantClient(
#     url=QDRANT_URL,
#     api_key=QDRANT_API_KEY,
#     timeout=120.0
# )

logger.info("Initializing Groq LLM...")
llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY,
    temperature=0.3,
    request_timeout=120.0,
    max_retries=3
)

logger.info("All models loaded successfully!")

logger.info("Initializing Groq client for Whisper...")
groq_client = Groq(api_key=GROQ_API_KEY)

# ---------------------------
# RAG Function
# ---------------------------
LANGUAGE_NAMES = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'ml': 'Malayalam',
    'te': 'Telugu',
    'kn': 'Kannada'
}

def retrieve_and_generate(query: str, k: int = 3, language: str = 'en') -> dict:
    """Retrieve relevant documents and generate a response using Groq"""

    # 0. Translate Query if needed (for non-ASCII / multilingual input)
    search_query = query
    if not query.isascii():
        try:
            translation_prompt = (
                "Translate the following text to English. "
                "Output ONLY the translation, nothing else.\n\n"
                f"Text: {query}"
            )
            translation_response = llm.invoke(translation_prompt)
            search_query = translation_response.content.strip()
            logger.info(f"Translated query for search: '{search_query}'")
        except Exception as e:
            logger.warning(f"Translation failed, using original: {e}")

    # 1. Embed the query
    query_vector = embedding_model.encode(search_query).tolist()

    # 2. Search in Qdrant
    try:
        # Create client per request to ensure connection
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            timeout=120.0
        )
        
        search_results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=k
        ).points
    except Exception as e:
        raise Exception(f"Database Connection Error: {str(e)}")

    if not search_results:
        return {
            "answer": "I couldn't find any relevant information in my agriculture database.",
            "sources": []
        }

    # Log search results for debugging
    for i, r in enumerate(search_results):
        logger.info(f"  Result {i+1}: score={r.score:.3f} crop={r.payload.get('crop')} disease={r.payload.get('disease')}")

    # 3. Build context from results
    context_parts = []
    for i, result in enumerate(search_results):
        context_parts.append(f"Document {i+1}:\n{result.payload['text']}\n")

    context = "\n".join(context_parts)

    # 4. Generate response with LLM
    lang_name = LANGUAGE_NAMES.get(language, 'English')
    logger.info(f"Generating response in language: {language} ({lang_name})")
    
    if language != 'en':
        prompt = f"""You are a helpful agricultural assistant. You MUST respond ONLY in {lang_name} language. Do NOT use English at all.

Context (use this information to answer, but respond in {lang_name}):
{context}

Question: {query}

CRITICAL INSTRUCTIONS:
1. EVERY SINGLE WORD of your response MUST be in {lang_name}. Not English.
2. Use the Context above to answer the question accurately.
3. Be specific and helpful. Include symptoms, treatments, or prevention methods.
4. If technical terms have no {lang_name} equivalent, transliterate them.

Remember: Your ENTIRE response must be in {lang_name}. Zero English words.

Answer in {lang_name}:"""
    else:
        prompt = f"""You are a helpful agricultural assistant. Answer the question using the Context provided below.

Context:
{context}

Question: {query}

Instructions:
- Use the information from the Context to answer the question.
- Respond in English.
- Be specific and helpful. Include symptoms, treatments, or prevention methods if available in the context.

Answer:"""

    # Call LLM with retry for rate limits
    last_error = None
    for attempt in range(3):
        try:
            response = llm.invoke(prompt)
            logger.info(f"LLM response (first 100 chars): {response.content[:100]}")
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
            last_error = e
            error_str = str(e).lower()
            if "rate" in error_str or "429" in error_str or "limit" in error_str:
                wait_time = (attempt + 1) * 5
                logger.warning(f"Rate limited, waiting {wait_time}s before retry {attempt+1}/3...")
                time.sleep(wait_time)
            else:
                raise Exception(f"AI Model Error: {str(e)}")

    raise Exception(f"AI Model Error after 3 retries: {str(last_error)}")


# ---------------------------
# API Routes
# ---------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "rag-service"})


@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()

    if not data or "query" not in data:
        return jsonify({"error": "Missing 'query' field"}), 400

    query_text = data["query"]
    k = data.get("k", 3)
    language = data.get("language", "en")

    logger.info(f"RAG query received: '{query_text[:80]}...' (k={k}, lang={language})")

    try:
        result = retrieve_and_generate(query_text, k=k, language=language)
        return jsonify(result)
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/transcribe", methods=["POST"])
def transcribe():
    """Transcribe audio using Groq Whisper Large v3.
    Accepts either:
      - multipart form data with 'audio' file
      - JSON with 'audio_base64', 'filename', 'mimetype'
    """
    import base64

    audio_bytes = None
    language = "en"
    suffix = ".webm"

    # Check if JSON body with base64
    if request.is_json:
        data = request.get_json()
        if not data or "audio_base64" not in data:
            return jsonify({"error": "Missing 'audio_base64' field"}), 400
        audio_bytes = base64.b64decode(data["audio_base64"])
        language = data.get("language", "en")
        filename = data.get("filename", "audio.webm")
        suffix = "." + filename.split(".")[-1]
        logger.info(f"Transcription request (base64, lang={language}, file={filename})")

    # Check if multipart form data
    elif "audio" in request.files:
        audio_file = request.files["audio"]
        audio_bytes = audio_file.read()
        language = request.form.get("language", "en")
        suffix = "." + (audio_file.filename.split(".")[-1] if audio_file.filename else "webm")
        logger.info(f"Transcription request (multipart, lang={language})")

    else:
        return jsonify({"error": "No audio provided. Send 'audio' file or 'audio_base64' JSON."}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as f:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f.read()),
                model="whisper-large-v3",
                language=language[:2],
                response_format="text"
            )

        os.unlink(tmp_path)

        text = transcription.strip() if isinstance(transcription, str) else str(transcription).strip()
        logger.info(f"Transcription result: '{text[:100]}'")

        return jsonify({"text": text})

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        try:
            os.unlink(tmp_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    logger.info(f"Starting RAG service on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=False)
