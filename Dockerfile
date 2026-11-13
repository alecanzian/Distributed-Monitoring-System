# One image for every component. Each compose service picks its own command.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so this layer is cached between code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vitest.config.ts ./
COPY src ./src
COPY web ./web

ENV NODE_ENV=production
EXPOSE 3000 3001 3002

CMD ["npm", "run", "start:api"]
