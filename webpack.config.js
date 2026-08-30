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

  // Fix missing modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    vm: require.resolve('vm-browserify'),
  };

  // Fix Buffer issue
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};
