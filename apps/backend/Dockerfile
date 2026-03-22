FROM node:20-alpine

WORKDIR /app

RUN corepack enable

RUN apk add --no-cache git

COPY package.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile=false

COPY tsconfig.json vitest.config.ts ./
COPY src ./src

RUN pnpm build

# Run backend as non-root with the same UID/GID used by git-server's git user.
RUN chown -R 1000:1000 /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
