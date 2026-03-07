FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && apk add --no-cache postgresql-client

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
