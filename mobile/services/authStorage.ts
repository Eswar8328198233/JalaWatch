import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AdminUser } from './api';

const TOKEN_KEY = 'jalawatch_admin_token';
const USER_KEY = 'jalawatch_admin_user';

/**
 * Saves authentication token securely.
 * Uses Expo SecureStore (hardware-backed keystore on Android)
 * with AsyncStorage fallback for web or non-secure environments.
 */
export async function saveAuthSession(token: string, user: AdminUser): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.warn('[AuthStorage] SecureStore failed, falling back to AsyncStorage:', err);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Retrieves the stored JWT authentication token.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) return token;
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[AuthStorage] Failed to read token from SecureStore:', err);
    return await AsyncStorage.getItem(TOKEN_KEY);
  }
}

/**
 * Retrieves the stored authenticated admin user object.
 */
export async function getAuthUser(): Promise<AdminUser | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS !== 'web') {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    if (!raw) {
      raw = await AsyncStorage.getItem(USER_KEY);
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[AuthStorage] Failed to read user from storage:', err);
    return null;
  }
}

/**
 * Clears authentication token and user session (logout).
 */
export async function clearAuthSession(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    }
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(USER_KEY).catch(() => {});
  } catch (err) {
    console.warn('[AuthStorage] Failed to clear session:', err);
  }
}

