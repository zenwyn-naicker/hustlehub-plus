FROM node:22-bookworm-slim
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/src ./src
COPY backend/scripts/create-admin.js ./scripts/create-admin.js
COPY backend/server.js ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3443
USER node
EXPOSE 3443
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=12 CMD node -e "require('https').get('https://localhost:3443/api/health',{rejectUnauthorized:false},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]