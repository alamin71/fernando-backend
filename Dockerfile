# -------------------------------
# Stage 1: Build Stage
# -------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all deps (dev + prod)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to dist/
RUN npm run build


# -------------------------------
# Stage 2: Production Stage
# -------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy package files to install prod deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy built JS from builder stage
COPY --from=builder /app/dist ./dist

# PORT (change if needed)
EXPOSE 4000

# App start command
CMD ["node", "dist/server.js"]
