FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt

RUN pnpm run build

EXPOSE 4000

CMD sh -c "python3 rag_service.py & pnpm start"