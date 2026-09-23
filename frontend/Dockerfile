FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate && \
    pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "exec", "vite"]
