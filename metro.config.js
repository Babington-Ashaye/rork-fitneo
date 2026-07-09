const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Production exports and EAS builds enable this minifier. Development remains readable.
config.transformer.minifierPath = require.resolve("metro-minify-terser");
config.transformer.minifierConfig = {
  compress: {
    dead_code: true,
    drop_console: true,
    drop_debugger: true,
    passes: 3,
    pure_getters: true,
    unused: true
  },
  format: {
    comments: false
  },
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    keep_classnames: false,
    keep_fnames: false,
    safari10: true,
    toplevel: true
  },
  module: false,
  sourceMap: false,
  toplevel: true
};

module.exports = config;
