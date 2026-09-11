// babel.config.js - optimized
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { lazyImports: true }]],
    plugins: [
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-property-in-object',
    ],
  };
};
