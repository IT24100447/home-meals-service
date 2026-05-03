/**
 * Expo Config Plugin: withAndroidGradleFix
 *
 * Purpose: The EAS Build server regenerates android/ from scratch via `expo prebuild`.
 * This plugin runs AFTER prebuild and patches the root android/build.gradle to:
 *   1. Remove any hardcoded AGP version pin from the classpath (let EAS/RN choose it).
 *   2. Remove any resolutionStrategy that forces a specific AGP version.
 *   3. Inject namespace for android library subprojects that are missing one.
 *
 * Without this, native modules (async-storage, gesture-handler, reanimated, etc.)
 * fail with "No matching variant... No variants exist" because the AGP version
 * attribute expected by the consumer doesn't match what the subprojects advertise.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidGradleFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'build.gradle'
      );

      if (!fs.existsSync(gradlePath)) {
        console.warn('[withAndroidGradleFix] build.gradle not found at:', gradlePath);
        return config;
      }

      let contents = fs.readFileSync(gradlePath, 'utf8');

      // 1. Remove hardcoded AGP version pin e.g. 'com.android.tools.build:gradle:8.7.2'
      //    Replace with versionless reference so Gradle BOM / RN plugin resolves it.
      contents = contents.replace(
        /classpath\(['"]com\.android\.tools\.build:gradle:[^'"]+['"]\)/g,
        "classpath('com.android.tools.build:gradle')"
      );

      // 2. Remove the entire resolutionStrategy block that forces a specific AGP version.
      //    This block causes all native library subprojects to produce zero variants.
      contents = contents.replace(
        /configurations\.all\s*\{[\s\S]*?resolutionStrategy\s*\{[\s\S]*?force\s*['"]com\.android\.tools\.build:gradle:[^'"]+['"][\s\S]*?\}[\s\S]*?\}/gm,
        ''
      );

      // 3. Ensure the namespace injection subprojects block is present for libraries.
      //    Only add if not already there (prebuild may or may not add this).
      if (!contents.includes('subproject.plugins.withId("com.android.library")')) {
        const namespaceBlock = `
subprojects { subproject ->
  subproject.plugins.withId("com.android.library") {
    subproject.android {
      if (namespace == null) {
        namespace = "com.homebites.\${subproject.name.replaceAll(/[^a-zA-Z0-9]/, '_')}"
      }
      try {
        buildFeatures.buildConfig = true
      } catch (Exception e) {}
    }
  }
}
`;
        contents += namespaceBlock;
      }

      fs.writeFileSync(gradlePath, contents, 'utf8');
      console.log('[withAndroidGradleFix] Successfully patched android/build.gradle');
      return config;
    },
  ]);
};

module.exports = withAndroidGradleFix;
