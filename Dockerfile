FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN ls dist/

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

