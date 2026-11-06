const { withAppBuildGradle, withProjectBuildGradle } = require("@expo/config-plugins");

// Isolated Valhalla dependency probe: align Kotlin with the library's 2.3.0 metadata.
module.exports = function withValhallaDependencyProbe(config) {
  config = withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    const marker = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";
    if (contents.includes(marker)) {
      contents = contents.replace(marker, "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.0')");
    }
    config.modResults.contents = contents;
    return config;
  });

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
      const match = contents.match(/dependencies\s*\{/);
      if (!match) throw new Error("Valhalla probe: app dependencies block not found");
      const insertAt = match.index + match[0].length;
      contents = contents.slice(0, insertAt) + "\n    " + missing.join("\n    ") + contents.slice(insertAt);
    }

    const defaultConfig = contents.match(/defaultConfig\s*\{[\s\S]*?\n\s*\}/);
    if (!defaultConfig) throw new Error("Valhalla probe: app defaultConfig block not found");
    const block = defaultConfig[0];
    const minSdkLine = /minSdkVersion\s+[^\n]+/;
    if (minSdkLine.test(block)) {
      contents = contents.replace(block, block.replace(minSdkLine, "minSdkVersion 26"));
    } else {
      contents = contents.replace(block, block.replace(/defaultConfig\s*\{/, "$&\n        minSdkVersion 26"));
    }
    config.modResults.contents = contents;
    return config;
  });
};
