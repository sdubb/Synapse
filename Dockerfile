FROM node:22-alpine

WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy application source code
WORKDIR /app
COPY server/ ./server/
COPY runFullE2ETest.js ./

# Create persistent data directory
RUN mkdir -p /app/server/data

# Expose API port, MCP Gateway port, and Remote Bridge port
EXPOSE 4000 4005 4002

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Start Synapse Control Plane
CMD ["node", "server/src/index.js"]
