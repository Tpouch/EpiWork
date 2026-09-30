const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

// Prisma 7's adapter needs the connection URL explicitly, unlike the old
// schema-embedded `url = env(...)` — load .env here since nothing else in
// this app does (falls back to a shell-provided DATABASE_URL, e.g. the one
// the "test" script sets explicitly).
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
    }
  }
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
module.exports = new PrismaClient({ adapter });
