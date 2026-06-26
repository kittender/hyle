# Hylé web UI — Angular build served by nginx.
# Stage 1: build the static bundle.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve. config.js is regenerated from env at container start so one
# image works in any environment without a rebuild.
FROM nginx:1.27-alpine
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-hyle-config.sh
RUN chmod +x /docker-entrypoint.d/40-hyle-config.sh

ENV HYLE_REGISTRY_URL=http://localhost:3000
EXPOSE 80
