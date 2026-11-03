const fs = require("fs");
const path = require("path");
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withMainApplication,
  withProjectBuildGradle,
} = require("@expo/config-plugins");

const EXPO_KOTLIN_VERSION = "2.2.20";
const COMPILER_KOTLIN_VERSION = "2.3.0";
const JAVA_PACKAGE = "com.jett.distribution.routeplanner.valhalla";

const moduleSource = `package ${JAVA_PACKAGE};

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.valhalla.valhalla.Valhalla;
import com.valhalla.valhalla.config.ValhallaConfigFactory;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.io.File;
import android.net.Uri;

public final class JettValhallaModule extends ReactContextBaseJavaModule {
  private final ExecutorService executor = Executors.newSingleThreadExecutor();
  private Valhalla engine;
  private String activeConfigPath;

  JettValhallaModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() { return "JettValhalla"; }

  @ReactMethod
  public void route(String configPath, String requestJson, Promise promise) {
    if (configPath == null || configPath.trim().isEmpty()) {
      promise.reject("E_VALHALLA_CONFIG", "A Valhalla config file path is required.");
      return;
    }
    if (requestJson == null || requestJson.trim().isEmpty()) {
      promise.reject("E_VALHALLA_REQUEST", "A Valhalla route request is required.");
      return;
    }
    executor.execute(() -> {
      try {
        if (engine == null || !configPath.equals(activeConfigPath)) {
          closeEngineInternal();
          engine = new Valhalla(configPath);
          activeConfigPath = configPath;
        }
        promise.resolve(engine.routeRaw(requestJson));
      } catch (Throwable error) {
        closeEngineInternal();
        promise.reject("E_VALHALLA_ROUTE", error.getMessage(), error);
      }
    });
  }

  @ReactMethod
  public void routeWithTileExtract(String tileExtractPath, String requestJson, Promise promise) {
    if (tileExtractPath == null || tileExtractPath.trim().isEmpty()) {
      promise.reject("E_VALHALLA_TILES", "A Valhalla tile-extract TAR path is required.");
      return;
    }
    if (requestJson == null || requestJson.trim().isEmpty()) {
      promise.reject("E_VALHALLA_REQUEST", "A Valhalla route request is required.");
      return;
    }
    executor.execute(() -> {
      try {
        // Expo FileSystem returns file:// URIs, but Valhalla expects a plain
        // absolute filesystem path. Passing the URI verbatim can leave the
        // engine unable to read the TAR and produces misleading error 171s.
        String resolvedPath = tileExtractPath;
        if (tileExtractPath.startsWith("file://")) {
          String uriPath = Uri.parse(tileExtractPath).getPath();
          if (uriPath != null && !uriPath.isEmpty()) resolvedPath = uriPath;
        }
        File archive = new File(resolvedPath);
        if (!archive.isFile() || !archive.canRead()) {
          throw new IllegalArgumentException("Valhalla archive is not readable at resolved path: " + resolvedPath);
        }
        if (archive.length() < 1000000000L) {
          throw new IllegalArgumentException("Valhalla archive is unexpectedly small (" + archive.length() + " bytes). Expected the full UK archive.");
        }
        if (engine == null || !resolvedPath.equals(activeConfigPath)) {
          closeEngineInternal();
          engine = new Valhalla(
            getReactApplicationContext(),
            ValhallaConfigFactory.INSTANCE.usingTileExtract(resolvedPath, null)
          );
          activeConfigPath = resolvedPath;
        }
        promise.resolve(engine.routeRaw(requestJson));
      } catch (Throwable error) {
        closeEngineInternal();
        promise.reject("E_VALHALLA_ROUTE", error.getMessage(), error);
      }
    });
  }

  @ReactMethod
  public void closeEngine(Promise promise) {
    executor.execute(() -> {
      closeEngineInternal();
      promise.resolve(true);
    });
  }

  private void closeEngineInternal() {
    if (engine != null) {
      try { engine.close(); } catch (Exception ignored) { }
      engine = null;
      activeConfigPath = null;
    }
  }

  @Override
  public void invalidate() {
    executor.execute(this::closeEngineInternal);
    executor.shutdown();
    super.invalidate();
  }
}
`;

const packageSource = `package ${JAVA_PACKAGE};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class JettValhallaPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new JettValhallaModule(context));
    return modules;
  }
  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext context) {
    return Collections.emptyList();
  }
}
`;

module.exports = function withJettValhallaDependencies(config) {
  config = withGradleProperties(config, (mod) => {
    const props = mod.modResults;
    const existing = props.find((item) => item.type === "property" && item.key === "android.kotlinVersion");
    if (existing) existing.value = EXPO_KOTLIN_VERSION;
    else props.push({ type: "property", key: "android.kotlinVersion", value: EXPO_KOTLIN_VERSION });
    return mod;
  });

  config = withProjectBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::[0-9.]+)?/g,
      "org.jetbrains.kotlin:kotlin-gradle-plugin:" + COMPILER_KOTLIN_VERSION
    );
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const dependencies = [
      "implementation 'io.github.rallista:valhalla-mobile:0.6.4'",
      "implementation 'io.github.rallista:valhalla-models:0.5.2'",
      "implementation 'io.github.rallista:valhalla-models-config:0.5.2'",
      "implementation 'com.stadiamaps:osrm-openapi:0.0.10'",
    ];
    for (const dependency of dependencies) {
      if (!contents.includes(dependency)) {
        contents = contents.replace(/dependencies\s*\{/, (match) => match + "\n    " + dependency);
      }
    }

    // Compile Java sources with JDK 21 so javac can read Valhalla's Java 21
    // dependency classes, while retaining Android-compatible Java 17 bytecode.
    if (!/java\s*\{\s*toolchain\s*\{/.test(contents)) {
      // Expo's generated app/build.gradle uses apply-plugin statements rather
      // than a plugins {} block, so append the toolchain configuration.
      contents += "\n\njava {\n    toolchain {\n        languageVersion = JavaLanguageVersion.of(21)\n    }\n}\n";
    }

    if (/compileOptions\s*\{/.test(contents)) {
      contents = contents.replace(/compileOptions\s*\{/, (match) =>
        match + "\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17"
      );
    } else {
      contents = contents.replace(/android\s*\{/, (match) =>
        match + "\n    compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }"
      );
    }

    if (/kotlinOptions\s*\{/.test(contents)) {
      contents = contents.replace(/kotlinOptions\s*\{/, (match) => match + '\n        jvmTarget = "17"');
    } else {
      contents = contents.replace(/android\s*\{/, (match) =>
        match + '\n    kotlinOptions { jvmTarget = "17" }'
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    const marker = "PackageList(this).packages.apply {";
    const registration = "add(com.jett.distribution.routeplanner.valhalla.JettValhallaPackage())";
    let contents = mod.modResults.contents;
    if (!contents.includes(registration)) {
      if (!contents.includes(marker)) throw new Error("Jett Valhalla: could not find MainApplication package registration block");
      contents = contents.replace(marker, marker + "\n          " + registration);
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return withDangerousMod(config, ["android", async (mod) => {
    const root = mod.modRequest.projectRoot;
    const javaDir = path.join(root, "android", "app", "src", "main", "java", "com", "jett", "distribution", "routeplanner", "valhalla");
    fs.mkdirSync(javaDir, { recursive: true });
    fs.writeFileSync(path.join(javaDir, "JettValhallaModule.java"), moduleSource);
    fs.writeFileSync(path.join(javaDir, "JettValhallaPackage.java"), packageSource);
    return mod;
  }]);
};
