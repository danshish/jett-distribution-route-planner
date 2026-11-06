const { withAppBuildGradle } = require("@expo/config-plugins");

// Isolated dependency-resolution probe for Valhalla Mobile 0.5.1.
// This plugin deliberately adds dependencies only; it does not alter the live main branch.
module.exports = function withValhallaDependencyProbe(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    const dependencies = [
      "implementation 'io.github.rallista:valhalla-mobile:0.5.1'",
      "implementation 'io.github.rallista:valhalla-models:0.1.1'",
      "implementation 'io.github.rallista:valhalla-models-config:0.1.1'",
      "implementation 'com.stadiamaps:osrm-openapi:0.0.10'"
    ];
    const missing = dependencies.filter((line) => !contents.includes(line));
    if (missing.length) {
      const match = contents.match(/dependencies\\s*\\{/);
      if (!match) throw new Error("Valhalla probe: app dependencies block not found");
      const insertAt = match.index + match[0].length;
      contents = contents.slice(0, insertAt) + "\\n    " + missing.join("\\n    ") + contents.slice(insertAt);
    }
    config.modResults.contents = contents;
    return config;
  });
};
