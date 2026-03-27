FROM node:22-alpine

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY server.js ./
COPY config/ config/
COPY middleware/ middleware/
COPY routes/ routes/
COPY services/ services/
COPY repositories/ repositories/
COPY db/ db/

# Run as built-in non-root user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3001/healthz || exit 1

CMD ["node", "server.js"]
