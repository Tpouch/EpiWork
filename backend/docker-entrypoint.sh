#!/bin/sh
set -e

pnpm exec prisma migrate deploy

if [ ! -f prisma/.seeded ]; then
  pnpm run seed
  touch prisma/.seeded
fi

exec node src/index.js
