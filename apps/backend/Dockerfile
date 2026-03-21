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

CMD ["node", "dist/index.js"]
