FROM node:22.9-alpine3.19

RUN mkdir -p /srv/app
## copy repo into image
COPY . /srv/app

RUN cd /srv/app && \
    npm ci

CMD ["node", "/srv/app/src/lib/server.js"]