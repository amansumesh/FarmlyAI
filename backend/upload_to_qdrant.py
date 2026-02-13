import os
import json
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient

from dotenv import load_dotenv

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

DATA_PATH = "backend/data/comprehensive_agriculture_data.json"

# ---------------------------
# Load JSON and convert to documents
# ---------------------------
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

documents = []

for item in data:
    text = f"""
Crop: {item['crop']}
Category: {item['category']}
Disease: {item['disease']}

Symptoms: {item['content']['english']['symptoms']}
Treatment: {item['content']['english']['treatment']}
Prevention: {item['content']['english']['prevention']}
"""

    documents.append(
        Document(
            page_content=text,
            metadata={
                "id": item["id"],
                "crop": item["crop"],
                "category": item["category"],
                "disease": item["disease"]
            }
        )
    )

print(f"Loaded {len(documents)} documents")

# ---------------------------
# Embedding model
# ---------------------------
from sentence_transformers import SentenceTransformer

# Use SentenceTransformer directly
model = SentenceTransformer("all-MiniLM-L6-v2")

# Wrap it for LangChain compatibility
class CustomEmbeddings:
    def __init__(self, model):
        self.model = model
    
    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()
    
    def embed_query(self, text):
        return self.model.encode([text])[0].tolist()

embedding = CustomEmbeddings(model)

# ---------------------------
# Connect to Qdrant Cloud
# ---------------------------
client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

# ---------------------------
# Upload to Qdrant
# ---------------------------
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

# Create collection if it doesn't exist
try:
    client.get_collection(COLLECTION_NAME)
    print(f"Collection '{COLLECTION_NAME}' already exists")
except:
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Created collection '{COLLECTION_NAME}'")

# Prepare points for upload
points = []
for i, doc in enumerate(documents):
    vector = embedding.embed_query(doc.page_content)
    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={
            "text": doc.page_content,
            **doc.metadata
        }
    )
    points.append(point)
    if (i + 1) % 10 == 0:
        print(f"Processed {i + 1}/{len(documents)} documents")

# Upload in batches
batch_size = 50
for i in range(0, len(points), batch_size):
    batch = points[i:i + batch_size]
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=batch
    )
    print(f"Uploaded batch {i//batch_size + 1}/{(len(points) + batch_size - 1)//batch_size}")

print(f"✅ Successfully uploaded {len(documents)} documents to Qdrant!")
