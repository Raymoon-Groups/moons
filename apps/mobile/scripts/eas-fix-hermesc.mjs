/**
 * EAS + pnpm: ensure hermesc binaries are executable after install.
 * Without this, :app:createBundleReleaseJsAndAssets can fail with
 * "A problem occurred starting process .../hermesc".
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function chmodIfExists(file) {
  if (!fs.existsSync(file)) return false;
  try {
    fs.chmodSync(file, 0o755);
    console.log(`[eas-fix-hermesc] chmod +x ${file}`);
    return true;
  } catch (err) {
    console.warn(`[eas-fix-hermesc] skip ${file}: ${err.message}`);
    return false;
  }
}

function scanHermescDirs(base) {
  if (!fs.existsSync(base)) return 0;
  let count = 0;
  for (const arch of fs.readdirSync(base)) {
    const bin = path.join(base, arch, 'hermesc');
    const binWin = path.join(base, arch, 'hermesc.exe');
    if (chmodIfExists(bin)) count += 1;
    if (chmodIfExists(binWin)) count += 1;
  }
  return count;
}

const moduleRoots = [
  path.resolve(__dirname, '../../../node_modules'),
  path.resolve(__dirname, '../node_modules'),
];

let fixed = 0;

for (const root of moduleRoots) {
  // Classic location
  fixed += scanHermescDirs(path.join(root, 'react-native', 'sdks', 'hermesc'));
  fixed += scanHermescDirs(path.join(root, 'hermes-compiler', 'hermesc'));

  // pnpm virtual store
  const pnpm = path.join(root, '.pnpm');
  if (!fs.existsSync(pnpm)) continue;
  for (const entry of fs.readdirSync(pnpm)) {
    if (entry.startsWith('react-native@')) {
      fixed += scanHermescDirs(
        path.join(pnpm, entry, 'node_modules', 'react-native', 'sdks', 'hermesc'),
      );
    }
    if (entry.startsWith('hermes-compiler@')) {
      fixed += scanHermescDirs(
        path.join(pnpm, entry, 'node_modules', 'hermes-compiler', 'hermesc'),
      );
    }
  }
}

if (fixed === 0) {
  console.warn('[eas-fix-hermesc] no hermesc binaries found');
} else {
  console.log(`[eas-fix-hermesc] fixed ${fixed} binary(ies)`);
}
