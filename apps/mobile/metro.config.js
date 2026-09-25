const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Keep Expo defaults, then add monorepo root for @moons/shared.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), monorepoRoot]),
);

config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single React copy from this app. Do NOT set disableHierarchicalLookup —
// pnpm nests deps (e.g. hoist-non-react-statics) and that flag breaks bundling.
const REACT_SINGLETONS = new Set(['react', 'react-dom', 'react-native', 'react-native-web']);

const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (REACT_SINGLETONS.has(moduleName)) {
    try {
      return {
        filePath: require.resolve(moduleName, { paths: [mobileNodeModules] }),
        type: 'sourceFile',
      };
    } catch {
      // fall through to default resolver
    }
  }

  if (typeof previousResolveRequest === 'function') {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
