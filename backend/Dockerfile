FROM node:20-alpine

WORKDIR /app

# Install python + pip
RUN apk add --no-cache python3 py3-pip

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install node deps
RUN pnpm install

# Copy all source code
COPY . .

# Install python deps for rag
RUN pip3 install --no-cache-dir -r requirements.txt

# Build TS
RUN pnpm run build

# Expose backend port
EXPOSE 4000

# Start both RAG + Node backend
CMD sh -c "python3 rag_service.py & pnpm start"