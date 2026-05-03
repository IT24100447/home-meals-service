const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Community native modules that need to be explicitly included in settings.gradle.
 * Format: { gradleName: 'project-name', npmPath: 'relative/path/in/node_modules' }
 */
const COMMUNITY_MODULES = [
  {
    gradleName: 'react-native-async-storage_async-storage',
    npmPath: '@react-native-async-storage/async-storage/android',
  },
  {
    gradleName: 'react-native-gesture-handler',
    npmPath: 'react-native-gesture-handler/android',
  },
  {
    gradleName: 'react-native-reanimated',
    npmPath: 'react-native-reanimated/android',
  },
  {
    gradleName: 'react-native-safe-area-context',
    npmPath: 'react-native-safe-area-context/android',
  },
  {
    gradleName: 'react-native-screens',
    npmPath: 'react-native-screens/android',
  },
  {
    gradleName: 'react-native-worklets',
    npmPath: 'react-native-worklets/android',
  },
];

const withAndroidGradleFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;

      // ─── 1. Patch android/build.gradle ────────────────────────────────────
      const buildGradlePath = path.join(platformRoot, 'build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let contents = fs.readFileSync(buildGradlePath, 'utf8');

        // Remove any hardcoded AGP version pin in classpath
        contents = contents.replace(
          /classpath\(['"]com\.android\.tools\.build:gradle:[^'"]+['"]\)/g,
          "classpath('com.android.tools.build:gradle')"
        );

        // Remove any resolutionStrategy that forces a specific AGP version
        contents = contents.replace(
          /configurations\.all\s*\{[\s\S]*?resolutionStrategy\s*\{[\s\S]*?force\s*['"]com\.android\.tools\.build:gradle:[^'"]+['"][\s\S]*?\}[\s\S]*?\}/gm,
          ''
        );

        // Ensure namespace injection block is present
        if (!contents.includes('subproject.plugins.withId("com.android.library")')) {
          contents += `
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
        }

        fs.writeFileSync(buildGradlePath, contents, 'utf8');
        console.log('[withAndroidGradleFix] ✓ Patched android/build.gradle');
      }

      // ─── 2. Patch android/settings.gradle ────────────────────────────────
      const settingsGradlePath = path.join(platformRoot, 'settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        let settings = fs.readFileSync(settingsGradlePath, 'utf8');

        // Build explicit include block for community modules
        // These are appended AFTER the existing autolinking calls.
        // If autolinking already included them, the extra include is a no-op.
        // If autolinking silently failed, this ensures they are found.
        let explicitIncludes = '\n// --- Explicit community module includes (withAndroidGradleFix) ---\n';
        for (const mod of COMMUNITY_MODULES) {
          // Use a Gradle-evaluated path relative to rootDir so it resolves
          // correctly on the EAS Linux server, not from this Windows machine.
          explicitIncludes += `
if (!settings.findProject(':${mod.gradleName}')) {
  include ':${mod.gradleName}'
  project(':${mod.gradleName}').projectDir = new File(rootDir, '../node_modules/${mod.npmPath}')
}
`;
        }

        // Only add the block if it isn't already there
        if (!settings.includes('Explicit community module includes (withAndroidGradleFix)')) {
          settings += explicitIncludes;
          fs.writeFileSync(settingsGradlePath, settings, 'utf8');
          console.log('[withAndroidGradleFix] ✓ Patched android/settings.gradle');
        }
      }

      return config;
    },
  ]);
};

module.exports = withAndroidGradleFix;
