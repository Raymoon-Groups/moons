const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Required so Metro can resolve @moons/shared from the monorepo root.
config.watchFolders = [monorepoRoot];

module.exports = config;
