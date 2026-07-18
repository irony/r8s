FROM node:20-alpine

WORKDIR /app

# Install git and kubectl
RUN apk add --no-cache git curl bash
RUN curl -LO "https://dl.k8s/release/$(curl -L -s https://dl.k8s/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Copy package files
COPY package.json ./
COPY ../../packages/core/package.json ./packages/core/
COPY ../../packages/cli/package.json ./packages/cli/

# Install dependencies
RUN npm install

# Copy source
COPY . .
COPY ../../packages/core ./packages/core
COPY ../../packages/cli ./packages/cli

# Build
RUN npm run build

CMD ["node", "dist/index.js"]
