import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.systelos.equipe',
  appName: 'SYSTELOS EQUIPE',
  webDir: 'dist',
  server: {
    // Em desenvolvimento: aponta para o portal local
    // Em produção: remove o server.url e usa o build estático
    url: 'https://ponto.systelos.com.br',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // true apenas em dev
  },
  plugins: {
    Camera: {
      // Selfie obrigatória — abre câmera frontal
      presentationStyle: 'fullscreen',
    },
    Geolocation: {
      // GPS para marcar ponto
    },
  },
};

export default config;
