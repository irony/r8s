# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/r8s-controller/package.json ./packages/r8s-controller/
COPY packages/r8s-controller/tsconfig.json ./packages/r8s-controller/
COPY packages/r8s-controller/src ./packages/r8s-controller/src
COPY packages/core/package.json ./packages/core/
COPY packages/core/src ./packages/core/src
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/k8s-types/package.json ./packages/k8s-types/
COPY packages/k8s-types/src ./packages/k8s-types/src
COPY packages/k8s-types/tsconfig.json ./packages/k8s-types/
COPY packages/cli/package.json ./packages/cli/
COPY packages/cli/src ./packages/cli/src
COPY packages/cli/tsconfig.json ./packages/cli/
COPY tsconfig.json ./

RUN npm install --workspace @r8s/r8s-controller --workspace @r8s/cli --workspace @r8s/core --workspace @r8s/k8s-types
RUN npm run build --workspace @r8s/k8s-types
RUN npm run build --workspace @r8s/core
RUN npm run build --workspace @r8s/cli
RUN npm run build --workspace @r8s/r8s-controller

# Production stage
FROM node:20-alpine

RUN apk add --no-cache git curl bash
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

WORKDIR /app

# Copy package manifests (needed for "type": "module" and workspace resolution)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/r8s-controller/package.json ./packages/r8s-controller/
COPY --from=builder /app/packages/r8s-controller/dist ./packages/r8s-controller/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/k8s-types/package.json ./packages/k8s-types/
COPY --from=builder /app/packages/k8s-types/dist ./packages/k8s-types/dist
COPY --from=builder /app/packages/cli/package.json ./packages/cli/
COPY --from=builder /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "packages/r8s-controller/dist/controller.js"]
