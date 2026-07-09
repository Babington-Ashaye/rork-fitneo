process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

const babel = require("@babel/core");
const source = [
  'console.log("sensitive");',
  'console.warn("warning");',
  "debugger;",
  "const retained = 42;"
].join("\n");
const result = babel.transformSync(source, {
  configFile: require.resolve("../babel.config.js"),
  filename: "security-verification.ts"
});
const output = result?.code ?? "";

if (/console\.|debugger/.test(output) || !/retained/.test(output)) {
  throw new Error(`Production debug stripping failed. Output: ${output}`);
}

process.stdout.write(output);
