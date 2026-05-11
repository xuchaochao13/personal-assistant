FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

# 微信云托管默认 80 端口
ENV PORT=80
ENV DB_PATH=/app/data/app.db

RUN mkdir -p /app/data

EXPOSE 80

CMD ["node", "src/index.js"]
