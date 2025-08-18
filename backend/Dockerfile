FROM node:20-alpine  # Usa imagem Node 20 leve
WORKDIR /app  # Define diretório de trabalho
COPY package*.json ./  # Copia package.json e lock
RUN npm install  # Instala dependências
COPY . .  # Copia todo o código
CMD ["npx", "tsx", "src/server.ts"]  # Comando para rodar servidor com tsx