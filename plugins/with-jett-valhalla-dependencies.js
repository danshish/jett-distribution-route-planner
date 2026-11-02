const {
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

// SDK 54 has an Expo KSP lookup table for Kotlin 2.2.20, but its
// Kotlin compiler classpath must be pinned separately for Kotlin 2.3 metadata.
const EXPO_KOTLIN_VERSION = "2.2.20";
const COMPILER_KOTLIN_VERSION = "2.3.0";

module.exports = function withJettValhallaDependencies(config) {
  config = withGradleProperties(config, (mod) => {
    const props = mod.modResults;
    const existing = props.find(
      (item) => item.type === "property" && item.key === "android.kotlinVersion"
    );
    if (existing) {
      existing.value = EXPO_KOTLIN_VERSION;
    } else {
      props.push({
        type: "property",
        key: "android.kotlinVersion",
        value: EXPO_KOTLIN_VERSION,
      });
    }
    return mod;
  });

  config = withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    contents = contents.replace(
      /org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::[0-9.]+)?/g,
      "org.jetbrains.kotlin:kotlin-gradle-plugin:" + COMPILER_KOTLIN_VERSION
    );
    mod.modResults.contents = contents;
    return mod;
  });

  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const dependency = "implementation 'io.github.rallista:valhalla-mobile:0.6.4'";
    if (!contents.includes(dependency)) {
      const block = /dependencies\s*\{/;
      if (!block.test(contents)) {
        throw new Error("Jett Valhalla: could not find Android dependencies block");
      }
      contents = contents.replace(block, (match) => match + "\n    " + dependency);
    }
    mod.modResults.contents = contents;
    return mod;
  });
};
