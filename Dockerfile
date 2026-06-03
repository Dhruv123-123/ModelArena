FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/index.js ./
COPY server/models ./models
COPY --from=frontend-builder /app/dist ./public
EXPOSE 3001
CMD ["node", "index.js"]
