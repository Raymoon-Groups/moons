import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const out = execSync('npx react-native config', {
  encoding: 'utf8',
  maxBuffer: 30e6,
  cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
});
writeFileSync(new URL('./autolink-dump.json', import.meta.url), out);
const hasWin = /C:\\\\Users|C:\/Users/.test(out);
console.log('bytes', out.length, 'hasWindowsPath', hasWin);
const m = out.match(/worklets[^,]{0,300}/gi);
console.log(m?.slice(0, 3));
