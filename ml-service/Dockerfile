FROM python:3.10-slim
WORKDIR /app
# Install dependencies
COPY requirements.txt .
# Install build tools just in case (for numpy/pillow which might need compilation)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
# Install python packages
# Using --no-cache-dir to keep image size smaller
RUN pip install --no-cache-dir -r requirements.txt
# Copy source code
COPY . .
# Expose port (Render sets PORT env variable)
EXPOSE 8000
# Start command (using uvicorn directly or via sh to use $PORT)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"