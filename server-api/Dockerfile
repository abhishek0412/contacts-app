FROM node:22-alpine

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY server.js ./
COPY db.json ./

# Run as built-in non-root user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3001/contacts || exit 1

CMD ["node", "server.js"]
