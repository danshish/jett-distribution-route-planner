const { withAppBuildGradle } = require("@expo/config-plugins");

const dependencies = [
  "implementation 'io.github.rallista:valhalla-mobile:0.6.4'",
  "implementation 'ai.mapmap:valhalla-engine:3.9.1-1'",
];

module.exports = function withJettValhallaDependencies(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const missing = dependencies.filter((line) => !contents.includes(line));
    if (missing.length) {
      const block = /dependencies\s*\{/;
      if (!block.test(contents)) {
        throw new Error("Jett Valhalla: could not find Android dependencies block");
      }
      contents = contents.replace(block, (match) => match + "\n    " + missing.join("\n    "));
    }
    mod.modResults.contents = contents;
    return mod;
  });
};
