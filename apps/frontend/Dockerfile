FROM node:20-alpine
WORKDIR /app
RUN corepack enable

COPY package.json ./
ENV NODE_ENV=development
RUN pnpm install --no-frozen-lockfile && pnpm add -D typescript vite

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "3000"]
