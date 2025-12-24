const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = config.resolver;

// Add JSON support for lesson content without losing default extensions
config.resolver.assetExts = Array.from(new Set([...assetExts, 'json']));
config.resolver.sourceExts = Array.from(new Set([...sourceExts, 'json']));

// Disable package exports to avoid import.meta errors on web
// This forces Metro to use CommonJS versions instead of ESM versions
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
