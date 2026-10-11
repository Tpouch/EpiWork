FROM node:24-alpine

# Install pnpm outside root's home so the unprivileged node user can run it.
ENV COREPACK_HOME=/usr/local/share/corepack

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate && \
    pnpm install --frozen-lockfile

COPY . .
# vite preview bundles vite.config.js into node_modules/.vite-temp at startup.
RUN pnpm build && \
    mkdir -p node_modules/.vite-temp && chown node:node node_modules/.vite-temp && \
    chown -R node:node $COREPACK_HOME
USER node

EXPOSE 5173

# Serve the production build: the dev server's on-the-fly dependency
# re-bundling breaks behind a reverse proxy (duplicate React, blank page).
# preview reuses server.host, allowedHosts and the /api proxy from vite.config.js.
CMD ["pnpm", "exec", "vite", "preview", "--port", "5173"]
