# r8s Documentation Site
# Multi-stage build for minimal image

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY docs/package.json ./docs/

# Install dependencies
RUN npm ci

# Copy source
COPY docs/ ./docs/
COPY packages/ ./packages/
COPY tsconfig.json ./

# Build the docs site
WORKDIR /app/docs
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/docs/dist /usr/share/nginx/html

# Copy nginx config
COPY k8s/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
