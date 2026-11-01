import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zahidmobiles.hisabbook',
  appName: 'Zahid Hisab Book',
  webDir: 'dist',
  backgroundColor: '#090d16',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
