# syntax=docker/dockerfile:1.6

############################
# Stage 1: Build Vite app
############################
FROM node:20-alpine AS builder

WORKDIR /app

# Cài deps trước để cache layer
COPY package*.json ./
RUN npm ci

# VITE_API_BASE_URL: URL mà frontend sẽ gọi.
# - Khi chạy trong docker-compose: truyền /api/v1 (relative) để nginx proxy tới backend container.
# - Khi build độc lập (deploy riêng trên Render): truyền BACKEND_URL=https://protech-backend-1qu3.onrender.com
#   bằng cách set BUILD_STANDALONE=1 và đặt BACKEND_URL.
ARG VITE_API_BASE_URL=/api/v1
ARG BACKEND_URL=
ARG BUILD_STANDALONE=0
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# Copy source trước khi build
COPY . .
# Nếu build độc lập ngoài compose, dùng BACKEND_URL thay vì relative path
RUN if [ "${BUILD_STANDALONE}" = "1" ] && [ -n "${BACKEND_URL}" ]; then \
      echo "Building standalone with BACKEND_URL=${BACKEND_URL}"; \
      export VITE_API_BASE_URL="${BACKEND_URL}/api/v1"; \
      npm run build; \
    else \
      echo "Building for docker-compose with VITE_API_BASE_URL=${VITE_API_BASE_URL}"; \
      npm run build; \
    fi

############################
# Stage 2: Nginx runtime
############################
FROM nginx:1.27-alpine AS runtime

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
