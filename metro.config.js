const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    react: path.resolve(projectRoot, "node_modules/react"),
    "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
    "react-native": path.resolve(projectRoot, "node_modules/react-native"),
    "react-native-web": path.resolve(projectRoot, "node_modules/react-native-web")
  }
};

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
  output: {
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
