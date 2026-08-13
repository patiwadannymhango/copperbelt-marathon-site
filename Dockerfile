# --- Build stage ---
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* env vars in at build time, so they're passed in as
# build args (set from docker-compose / GitHub Actions / --build-arg).
ARG VITE_API_BASE_URL
ARG VITE_EVENT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_EVENT_ID=${VITE_EVENT_ID}

RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
