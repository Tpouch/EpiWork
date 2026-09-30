FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate && \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 5173

# Serve the production build: the dev server's on-the-fly dependency
# re-bundling breaks behind a reverse proxy (duplicate React, blank page).
# preview reuses server.host, allowedHosts and the /api proxy from vite.config.js.
CMD ["pnpm", "exec", "vite", "preview", "--port", "5173"]
