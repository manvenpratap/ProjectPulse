import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.projectpulse.app',
  appName: 'ProjectPulse',
  webDir: 'dist',
  backgroundColor: '#0F172A',
  ios: {
    scheme: 'App',
    contentInset: 'never',
    preferredContentMode: 'mobile',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;
