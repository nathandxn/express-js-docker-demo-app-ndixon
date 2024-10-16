FROM node:22.9-alpine3.19

RUN mkdir -p /home/app
## copy repo into image
COPY . /home/app

CMD ["npm", "start"]