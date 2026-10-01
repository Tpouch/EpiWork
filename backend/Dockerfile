FROM node:24-alpine

# better-sqlite3 (used by the Prisma SQLite driver adapter) needs to compile
# its native binding.
RUN apk add --no-cache python3 make g++

# Install pnpm outside root's home so the unprivileged node user can run it.
ENV COREPACK_HOME=/usr/local/share/corepack

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate && \
    pnpm install --frozen-lockfile

COPY . .
RUN chmod +x docker-entrypoint.sh

# Prisma 7 needs the client generated explicitly; DATABASE_URL only needs to
# be present (not reachable) for this step since it doesn't connect to a DB.
# The SQLite volume is created from /data, so it inherits node ownership.
ENV DATABASE_URL="file:./prisma/dev.db"
RUN pnpm exec prisma generate && \
    mkdir -p /data && chown node:node /data && chown -R node:node $COREPACK_HOME
USER node

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
