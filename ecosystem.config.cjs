/**
 * PM2 production config for Moons.
 *
 * On the server (from repo root):
 *   1. pnpm install
 *   2. Copy .env to services/api/.env and apps/web/.env.local
 *   3. docker compose up -d          # Postgres + Redis
 *   4. pnpm db:migrate
 *   5. pnpm build
 *   6. pm2 start ecosystem.config.cjs
 *   7. pm2 save && pm2 startup
 *
 * Useful commands:
 *   pm2 list
 *   pm2 logs moons-api
 *   pm2 logs moons-web
 *   pm2 restart ecosystem.config.cjs
 */
const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'moons-api',
      cwd: path.join(root, 'services/api'),
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
    },
    {
      name: 'moons-web',
      cwd: path.join(root, 'apps/web'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
