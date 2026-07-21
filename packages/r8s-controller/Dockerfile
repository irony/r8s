# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/r8s-controller/package.json ./packages/r8s-controller/
COPY packages/r8s-controller/tsconfig.json ./packages/r8s-controller/
COPY packages/r8s-controller/src ./packages/r8s-controller/src
COPY packages/core ./packages/core
COPY packages/k8s-types ./packages/k8s-types
COPY packages/cli ./packages/cli
COPY tsconfig.json ./

RUN npm install --workspace @r8s/r8s-controller
RUN npm run build --workspace @r8s/r8s-controller

# Production stage
FROM node:20-alpine

RUN apk add --no-cache git curl bash
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

WORKDIR /app

COPY --from=builder /app/packages/r8s-controller/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/controller.js"]
