FROM node:alpine as builder
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx
#elastic beanstock will see this and expose this port
EXPOSE 80
COPY --from=builder /app/build /usr/share/nginx/html

