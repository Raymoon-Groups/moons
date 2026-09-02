const { withAndroidManifest, createRunOncePlugin } = require('expo/config-plugins');

const MEDIA_PERMISSIONS = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.ACCESS_MEDIA_LOCATION',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
];

function withBlockMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const permissions = manifest.manifest['uses-permission'];

    for (const permission of MEDIA_PERMISSIONS) {
      manifest.manifest['uses-permission'] = permissions.filter(
        (entry) => entry.$?.['android:name'] !== permission,
      );

      manifest.manifest['uses-permission'].push({
        $: {
          'android:name': permission,
          'tools:node': 'remove',
        },
      });
    }

    return config;
  });
}

module.exports = createRunOncePlugin(
  withBlockMediaPermissions,
  'with-block-media-permissions',
  '1.0.0',
);
