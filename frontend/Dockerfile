FROM node:20-alpine

WORKDIR /src

COPY package.json .

RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "start"]