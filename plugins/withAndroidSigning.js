const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('storeFile file("jett-upload-key.jks")')) {
      const signingConfigsMatch = contents.match(/signingConfigs\s*\{/);
      if (!signingConfigsMatch) {
        throw new Error("Jett Pal signing: could not find signingConfigs in android/app/build.gradle");
      }
      const insertAt = signingConfigsMatch.index + signingConfigsMatch[0].length;
      const releaseSigning = `
    release {
      storeFile file("jett-upload-key.jks")
      storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
      keyAlias System.getenv("ANDROID_KEY_ALIAS")
      keyPassword System.getenv("ANDROID_KEY_PASSWORD")
    }
`;
      contents = contents.slice(0, insertAt) + releaseSigning + contents.slice(insertAt);
    }

    const releaseBlock = /(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/;
    if (releaseBlock.test(contents)) {
      contents = contents.replace(releaseBlock, "$1signingConfigs.release");
    } else if (!/release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.release/.test(contents)) {
      throw new Error("Jett Pal signing: could not switch release build to the permanent signing key");
    }

    config.modResults.contents = contents;
    return config;
  });
};
