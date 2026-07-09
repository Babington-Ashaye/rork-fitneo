module.exports = function configureBabel(api) {
  const isProduction = api.env("production");

  return {
    presets: ["babel-preset-expo"],
    plugins: isProduction ? ["./babel/strip-production-debug"] : []
  };
};
