import { Platform } from 'react-native';

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
