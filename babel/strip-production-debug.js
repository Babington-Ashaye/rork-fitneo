module.exports = function stripProductionDebug({ types: t }) {
  const strippedMethods = new Set(["log", "warn", "debug", "info", "error", "trace"]);

  return {
    name: "strip-production-debug",
    visitor: {
      DebuggerStatement(path) {
        path.remove();
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          !t.isMemberExpression(callee) ||
          !t.isIdentifier(callee.object, { name: "console" }) ||
          !t.isIdentifier(callee.property) ||
          !strippedMethods.has(callee.property.name)
        ) {
          return;
        }
        if (path.parentPath.isExpressionStatement()) {
          path.parentPath.remove();
        } else {
          path.replaceWith(t.unaryExpression("void", t.numericLiteral(0)));
        }
      }
    }
  };
};
