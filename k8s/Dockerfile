# r8s Documentation Site
# Multi-stage build for minimal image

FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace packages first (needed for npm ci)
COPY packages/ ./packages/

# Copy root package files
COPY package.json package-lock.json ./

# Install root dependencies (includes workspace packages)
RUN npm ci

# Copy docs package files and install docs dependencies
COPY docs/package.json docs/package-lock.json ./docs/
RUN cd docs && npm ci

# Copy remaining source
COPY docs/ ./docs/
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
