FROM node:22-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --production

COPY server/ .

ENV PORT=80
ENV DB_PATH=/app/data/app.db

RUN mkdir -p /app/data

EXPOSE 80

CMD ["node", "src/index.js"]
