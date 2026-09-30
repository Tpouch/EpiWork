const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('prisma/config');

// Prisma 7's config file is evaluated before .env is loaded elsewhere in the
// app, so load it here too (falls back to shell-provided DATABASE_URL, e.g.
// the one the "test" script sets explicitly).
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
    }
  }
}

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
