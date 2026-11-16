import { Platform } from 'react-native';

/**
 * HookBridge Mobile Environment Configuration
 * Auto-selects appropriate host based on platform:
 * - Android Emulator: 10.0.2.2 (routes to host machine)
 * - iOS Simulator / Web: localhost
 * - Physical device: set to your machine's LAN IP or ngrok HTTPS URL
 */
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_PORT = 5000;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

export const SOCKET_SERVER_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

export default {
  API_BASE_URL,
  SOCKET_SERVER_URL
};

