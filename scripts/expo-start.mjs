/**
 * Start Expo with an interactive-friendly env so the QR / LAN URL is shown.
 * Cursor/CI shells often set CI=1, which makes Expo skip the QR code.
 */
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'mobile');

function lanIp() {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

const ip = lanIp();
const port = process.env.EXPO_PORT || '8081';

console.log('\n========================================');
console.log('  MoonsJob Expo (scan in Expo Go)');
console.log(`  exp://${ip}:${port}`);
console.log(`  Or open: http://localhost:${port}`);
console.log('========================================\n');

const env = { ...process.env };
delete env.CI;
env.EXPO_NO_TELEMETRY = process.env.EXPO_NO_TELEMETRY || '1';
// Skip Expo's remote native-module version check — undici often throws
// "Body is unusable: Body has already been read" on Windows / flaky networks.
// Use env only: CLI --offline conflicts with --lan.
env.EXPO_OFFLINE = process.env.EXPO_OFFLINE || '1';
env.FORCE_COLOR = '1';

const expoCli = path.join(mobileRoot, 'node_modules', 'expo', 'bin', 'cli');
const child = spawn(process.execPath, [expoCli, 'start', '--lan', '--port', port], {
  cwd: mobileRoot,
  stdio: 'inherit',
  env,
  shell: false,
});


child.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
