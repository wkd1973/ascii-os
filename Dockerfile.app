FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY cli ./cli
COPY content ./content
COPY engine ./engine
COPY web ./web
RUN npm run build

FROM node:22-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/content ./content

EXPOSE 3000

CMD ["node", "build/web/server.js"]
