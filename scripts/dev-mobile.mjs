/**
 * Start API + Expo. Expo is started via expo-start.mjs so the QR / LAN URL
 * is printed even when the terminal is non-interactive.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await new Promise((resolve, reject) => {
  const free = spawn(
    process.execPath,
    [path.join(root, 'scripts', 'free-port.mjs'), '3001', '8081'],
    { cwd: root, stdio: 'inherit', shell: false },
  );
  free.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`free-port exited ${code}`))));
});

const children = [];

function run(label, command, args, shell = false) {
  const env = { ...process.env, FORCE_COLOR: '1' };
  delete env.CI;
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell,
    env,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });
  return child;
}

console.log('\nStarting API on :3001 and Expo on :8081…\n');

run('api', 'pnpm', ['--filter', '@moons/api', 'dev'], true);

await new Promise((r) => setTimeout(r, 1000));

run('mobile', process.execPath, [path.join(root, 'scripts', 'expo-start.mjs')]);

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
