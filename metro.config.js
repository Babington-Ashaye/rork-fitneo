const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const isProduction = process.env.NODE_ENV === "production";

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
    drop_console: isProduction,
    drop_debugger: true,
    passes: isProduction ? 3 : 1,
    pure_getters: true,
    unused: true
  },
  output: {
    comments: false
  },
  keep_classnames: false,
  keep_fnames: false,
  mangle: isProduction
    ? {
        keep_classnames: false,
        keep_fnames: false,
        safari10: true,
        toplevel: true
      }
    : false,
  module: false,
  sourceMap: !isProduction,
  toplevel: isProduction
};

module.exports = config;
