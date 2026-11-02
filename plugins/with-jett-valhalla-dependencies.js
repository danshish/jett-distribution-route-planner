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

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class JettValhallaModule extends ReactContextBaseJavaModule {
  private final ExecutorService executor = Executors.newSingleThreadExecutor();
  private Valhalla engine;
  private String activeConfigPath;

  JettValhallaModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "JettValhalla";
  }

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
        String response = engine.routeRaw(requestJson);
        promise.resolve(response);
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
      try {
        engine.close();
      } catch (Exception ignored) {
        // Closing is best-effort during replacement or module shutdown.
      }
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
    const existing = props.find(
      (item) => item.type === "property" && item.key === "android.kotlinVersion"
    );
    if (existing) existing.value = EXPO_KOTLIN_VERSION;
    else props.push({ type: "property", key: "android.kotlinVersion", value: EXPO_KOTLIN_VERSION });
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

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const dependency = "implementation 'io.github.rallista:valhalla-mobile:0.6.4'";
    if (!contents.includes(dependency)) {
      const block = /dependencies\s*\{/;
      if (!block.test(contents)) throw new Error("Jett Valhalla: could not find Android dependencies block");
      contents = contents.replace(block, (match) => match + "\n    " + dependency);
    }

    // The published wrapper AAR contains Java 21 bytecode (class version 65).
    // Compile the app sources with Java 21 so javac can read the wrapper API.
    const compileOptions = /compileOptions\s*\{/;
    if (compileOptions.test(contents)) {
      contents = contents.replace(compileOptions, (match) =>
        match + "\n        sourceCompatibility JavaVersion.VERSION_21\n        targetCompatibility JavaVersion.VERSION_21"
      );
    } else {
      const androidBlock = /android\s*\{/;
      if (!androidBlock.test(contents)) {
        throw new Error("Jett Valhalla: could not find Android block for Java 21 settings");
      }
      contents = contents.replace(
        androidBlock,
        (match) => match + "\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_21\n        targetCompatibility JavaVersion.VERSION_21\n    }"
      );
    }

    const kotlinOptions = /kotlinOptions\s*\{/;
    if (kotlinOptions.test(contents)) {
      contents = contents.replace(kotlinOptions, (match) => match + '\n        jvmTarget = "21"');
    } else {
      contents = contents.replace(
        /android\s*\{/,
        (match) => match + '\n    kotlinOptions { jvmTarget = "21" }'
      );
    }

    // Force every app JavaCompile task to Java 21. Expo/AGP can otherwise
    // retain the default Java 17 task target even when android.compileOptions changes.
    if (!contents.includes("tasks.withType(org.gradle.api.tasks.compile.JavaCompile)")) {
      contents += `\n\ntasks.withType(org.gradle.api.tasks.compile.JavaCompile).configureEach {\n    sourceCompatibility = JavaVersion.VERSION_21.toString()\n    targetCompatibility = JavaVersion.VERSION_21.toString()\n}\n`;
    }

    mod.modResults.contents = contents;
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    const marker = "PackageList(this).packages.apply {";
    const registration = "add(com.jett.distribution.routeplanner.valhalla.JettValhallaPackage())";
    let contents = mod.modResults.contents;
    if (!contents.includes(registration)) {
      if (!contents.includes(marker)) {
        throw new Error("Jett Valhalla: could not find MainApplication package registration block");
      }
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
