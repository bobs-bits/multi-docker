FROM node:alpine
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
#diff from client
CMD ["npm", "run", "start"]
