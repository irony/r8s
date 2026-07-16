FROM node:20-alpine

WORKDIR /app

# Install tsx globally for rendering
RUN npm install -g tsx@^4.0.0

# Copy controller code
COPY dist/ ./dist/
COPY package.json ./

# Install production dependencies
RUN npm install --production

# Make controller executable
RUN chmod +x dist/controller.js

ENTRYPOINT ["node", "dist/controller.js"]
