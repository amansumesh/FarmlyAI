from sentence_transformers import SentenceTransformer
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

DATA_PATH = "data/comprehensive_agriculture_data.json"

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

print(f"Loaded {len(documents)} documents", flush=True)

# ---------------------------
# Embedding model
# ---------------------------
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
    print(f"Checking for existing collection '{COLLECTION_NAME}'...")
    client.delete_collection(COLLECTION_NAME)
    print(f"Deleted existing collection '{COLLECTION_NAME}'")
except Exception as e:
    # Collection likely doesn't exist, which is fine
    print(f"No existing collection to delete or delete failed: {e}")

try:
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Created new collection '{COLLECTION_NAME}'")
except Exception as e:
    print(f"Failed to create collection: {e}")
    exit(1)

# Prepare points for upload
points = []
print("Starting embedding generation...", flush=True)
for i, doc in enumerate(documents):
    try:
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
        if (i + 1) % 5 == 0:
            print(f"Generated embeddings for {i + 1}/{len(documents)} documents", end="\r", flush=True)
    except Exception as e:
        print(f"\n❌ Failed to embed document {i}: {e}")

print(f"\nGenerated {len(points)} vectors.")

# Upload in batches
import time
batch_size = 20
for i in range(0, len(points), batch_size):
    batch = points[i:i + batch_size]
    try:
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=batch
        )
        print(f"Uploaded batch {i//batch_size + 1}/{(len(points) + batch_size - 1)//batch_size}")
        time.sleep(1) # Be nice to the API
    except Exception as e:
        print(f"❌ Failed to upload batch {i}: {e}")

print(f"✅ Successfully uploaded {len(documents)} documents to Qdrant!")
