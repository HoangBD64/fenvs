# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

# Stage 2: Serve with Nuxt
FROM node:20-alpine

WORKDIR /app

RUN npm install -g nuxt

COPY --from=builder /app ./

EXPOSE 3000

CMD ["nuxt", "start"]
