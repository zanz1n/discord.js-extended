FROM node:lts-alpine3.16

WORKDIR /bot

RUN apk add openssl

COPY package.json /bot/package.json
COPY yarn.lock /bot/yarn.lock

RUN yarn install --frozen-lockfile --production=true

COPY dist /bot/dist

CMD node dist/worker.js
