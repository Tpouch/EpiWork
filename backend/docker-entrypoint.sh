#!/bin/sh
set -e

pnpm exec prisma migrate deploy

if [ ! -f /data/.seeded ]; then
  pnpm run seed
  touch /data/.seeded
fi

exec node src/index.js
