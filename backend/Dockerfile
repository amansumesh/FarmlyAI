FROM node:20-slim

WORKDIR /app

# install python + venv
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# install pnpm
RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

# create venv + install python requirements
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install --no-cache-dir -r requirements.txt

RUN pnpm run build

EXPOSE 4000

CMD sh -c "python rag_service.py & pnpm start"