import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/disease_model.pth")
    DEVICE: str = os.getenv("DEVICE", "cpu")

settings = Settings()
