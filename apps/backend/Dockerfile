FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile=false

COPY tsconfig.json vitest.config.ts ./
COPY src ./src

RUN pnpm build

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/index.js"]
