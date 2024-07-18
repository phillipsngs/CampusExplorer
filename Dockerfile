FROM node:18-alpine

RUN apk add --no-cache git

WORKDIR .

COPY package.json .

COPY .git .git

RUN npm i

COPY . .

EXPOSE 4321

CMD ["npm", "start"]