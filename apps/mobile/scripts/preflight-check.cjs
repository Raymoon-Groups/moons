const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;

function ver(name) {
  try {
    return require(require.resolve(`${name}/package.json`, { paths: [root] })).version;
  } catch {
    return 'MISSING';
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const checks = [];
function ok(name, cond, detail = '') {
  checks.push({ name, ok: Boolean(cond), detail });
}

const indexJs = read('index.js');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const gradleProps = read('android/gradle.properties');
const proguard = read('android/app/proguard-rules.pro');
const iconMagic = Buffer.from(
  fs.readFileSync(path.join(root, 'assets/icon.png')).slice(0, 4),
).toString('hex');
const adaptiveMagic = Buffer.from(
  fs.readFileSync(path.join(root, 'assets/adaptive-icon.png')).slice(0, 4),
).toString('hex');

ok('main is index.js', pkg.main === 'index.js', pkg.main);
ok('index.js imports gesture-handler', indexJs.includes('react-native-gesture-handler'));
ok('index.js imports reanimated', indexJs.includes('react-native-reanimated'));
ok('app version 1.0.6', app.version === '1.0.6', app.version);
ok('newArchEnabled true', app.newArchEnabled === true);
ok(
  'gesture-handler installed',
  ver('react-native-gesture-handler') !== 'MISSING',
  ver('react-native-gesture-handler'),
);
ok(
  'reanimated installed',
  ver('react-native-reanimated') !== 'MISSING',
  ver('react-native-reanimated'),
);
ok('worklets installed', ver('react-native-worklets') !== 'MISSING', ver('react-native-worklets'));
ok('expo-asset installed', ver('expo-asset') !== 'MISSING', ver('expo-asset'));
ok('expo-system-ui installed', ver('expo-system-ui') !== 'MISSING', ver('expo-system-ui'));
ok(
  'image-manipulator is 14.x',
  ver('expo-image-manipulator').startsWith('14.'),
  ver('expo-image-manipulator'),
);
ok('keyboard-controller removed', ver('react-native-keyboard-controller') === 'MISSING');
ok('icon is real PNG', iconMagic === '89504e47', iconMagic);
ok('adaptive icon is real PNG', adaptiveMagic === '89504e47', adaptiveMagic);
ok('cleartext disabled in manifest', manifest.includes('usesCleartextTraffic="false"'));
ok(
  'RECORD_AUDIO blocked in manifest',
  manifest.includes('RECORD_AUDIO') && manifest.includes('tools:node="remove"'),
);
ok('gradle newArchEnabled=true', gradleProps.includes('newArchEnabled=true'));
ok('proguard keeps gesture-handler', proguard.includes('gesturehandler'));
ok(
  'production API fallback configured',
  read('lib/api-url.ts').includes('https://api.moonsjob.com/api/v1'),
);
ok('eas production profile exists', fs.existsSync(path.join(root, 'eas.json')));
ok('expo-system-ui in plugins', JSON.stringify(app.plugins).includes('expo-system-ui'));

let failed = 0;
for (const c of checks) {
  if (!c.ok) failed += 1;
  console.log(`${c.ok ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ` | ${c.detail}` : ''}`);
}
console.log(`TOTAL ${checks.length - failed}/${checks.length}`);
process.exit(failed ? 1 : 0);
