FROM keymetrics/pm2:16-alpine

COPY package.json .
COPY pm2.json .
COPY src src/

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production

# Show current folder structure in logs
RUN ls -al -R

EXPOSE 3000

CMD [ "pm2-runtime", "start", "pm2.json" ]