FROM node:24-alpine

# better-sqlite3 (used by the Prisma SQLite driver adapter) needs to compile
# its native binding.
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate && \
    pnpm install --frozen-lockfile

COPY . .
RUN chmod +x docker-entrypoint.sh

# Prisma 7 needs the client generated explicitly; DATABASE_URL only needs to
# be present (not reachable) for this step since it doesn't connect to a DB.
ENV DATABASE_URL="file:./prisma/dev.db"
RUN pnpm exec prisma generate

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
