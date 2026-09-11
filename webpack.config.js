// webpack.config.js
const path = require('path');
const webpack = require('webpack');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-safe-area-context': 'react-native-safe-area-context/lib/commonjs',
  };

  // No polyfills needed for web - removed buffer/crypto/stream/vm for performance

  return config;
};
