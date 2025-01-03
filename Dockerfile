FROM node:20

WORKDIR /usr/src/app

# Install dependencies and tools
RUN apt-get update && apt-get install -y netcat-openbsd \
    && corepack enable \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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
CMD ["pnpm", "start:dev"]