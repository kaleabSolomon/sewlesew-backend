FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies and tools
RUN apk update && apk add --no-cache netcat-openbsd \
    && corepack disable \
    && npm install -g pnpm

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./

# Install Node.js dependencies
RUN pnpm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the application port
EXPOSE 3333

# Set environment variable and start the application
ENV PORT=3333
CMD ["pnpm", "start:prod"]
