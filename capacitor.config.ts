import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jordigomez.collabtask',
  appName: 'CollabTask',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '321978884875-3uduv9jbd84iqoqk4ncpifg8eqv8du3e.apps.googleusercontent.com',
      androidClientId: '321978884875-3uduv9jbd84iqoqk4ncpifg8eqv8du3e.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
