FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies and tools
RUN apk update && apk add --no-cache netcat-openbsd \
    && corepack disable \
    && npm install -g pnpm

# Copy dependency files first
COPY package.json pnpm-lock.yaml prisma/schema.prisma ./
# Install Node.js dependencies
RUN pnpm install --frozen-lockfile --loglevel verbose
# Copy the rest of the application files
COPY . .

# Build the project
RUN pnpm run build

# Expose the application port
EXPOSE 3333

# Set environment variable and start the application
ENV PORT=3333
CMD ["sh", "-c", "npx prisma generate && pnpm start:prod"]
