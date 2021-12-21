FROM node:latest

COPY ./ /app
WORKDIR /app

RUN npm install
RUN npm install pm2 -g

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]