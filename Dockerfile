FROM node:latest

ADD . /app
WORKDIR /app

RUN apt-get update && apt-get install -y --force-yes nmap

RUN npm install

ENV NODE_ENV production
ENV PORT 80

EXPOSE 80

CMD ["node", "server.js"]