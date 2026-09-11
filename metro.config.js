// metro.config.js - optimized for performance
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

// Enable minification and tree-shaking
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2,
  },
  mangle: true,
  output: {
    comments: false,
  },
};

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Fix react-native-svg buffer import
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

// Exclude adhan from mobile (not used - custom calculation is used)
config.resolver.blockList = [/adhan\..*\.js$/];

module.exports = config;
