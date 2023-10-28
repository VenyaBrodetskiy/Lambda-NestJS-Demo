FROM node:18.18.2-slim

RUN apt-get update && apt-get install curl -y

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start"]
