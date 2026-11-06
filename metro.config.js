const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Firebase's auth package registers itself twice when Metro uses "package exports",
 * which causes "Component auth has not been registered yet". Turning package exports
 * off for the whole app breaks React Native's own packages, so it is turned off only
 * for Firebase imports here.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const isFirebase =
        moduleName === 'firebase' ||
        moduleName.startsWith('firebase/') ||
        moduleName.startsWith('@firebase/');
      if (isFirebase) {
        return context.resolveRequest(
          {...context, unstable_enablePackageExports: false},
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);