const {
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

const KOTLIN_VERSION = "2.3.0";

module.exports = function withJettValhallaDependencies(config) {
  config = withGradleProperties(config, (mod) => {
    const props = mod.modResults;
    const existing = props.find(
      (item) => item.type === "property" && item.key === "android.kotlinVersion"
    );
    if (existing) {
      existing.value = KOTLIN_VERSION;
    } else {
      props.push({ type: "property", key: "android.kotlinVersion", value: KOTLIN_VERSION });
    }
    return mod;
  });

  // Expo/RN can still resolve the Kotlin Gradle plugin from its buildscript
  // classpath, so pin that plugin as well as the generated Gradle property.
  config = withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    contents = contents.replace(
      /org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::[0-9.]+)?/g,
      "org.jetbrains.kotlin:kotlin-gradle-plugin:" + KOTLIN_VERSION
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
