// 定时更新通知服务 — 用本地推送提醒用户打开 App 检查新岗位
// ⚠️ expo-notifications 在 Expo Go (SDK 53+) 中不可用
// 用 Constants.appOwnership 检测运行环境，Expo Go 中完全跳过加载

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 配置 ─────────────────────────────────────────────────

const UPDATE_FREQUENCY_KEY = 'job_hunter_update_frequency_days';
const NOTIFICATION_ENABLED_KEY = 'job_hunter_notification_enabled';
const LAST_NOTIFY_KEY = 'job_hunter_last_notify_time';

// ── 环境检测 ──────────────────────────────────────────────
// appOwnership: 'expo' = Expo Go, 'standalone' = 独立APP, 'generic' = Development Build
// 在 Expo Go 中完全跳过 expo-notifications，避免模块加载即崩溃

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// 懒加载 expo-notifications（仅非 Expo Go 环境）
let _Notifications: any = null;
let _loaded = false;

function getNotifications(): any {
  if (_loaded) return _Notifications;
  _loaded = true;

  if (isExpoGo()) {
    console.log('[NotifyService] Expo Go 模式：跳过 expo-notifications 加载');
    return null;
  }

  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    _Notifications = Notifications;
    console.log('[NotifyService] expo-notifications 加载成功');
  } catch (e) {
    console.warn('[NotifyService] expo-notifications 加载失败:', e);
    _Notifications = null;
  }
  return _Notifications;
}

/**
 * 通知功能是否可用（Expo Go 中返回 false）
 */
export function isNotificationsSupported(): boolean {
  if (isExpoGo()) return false;
  return getNotifications() !== null;
}

// ── 通知权限 ──────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── 定时提醒调度 ──────────────────────────────────────────

/**
 * 注册定时本地通知
 * @param frequencyDays 更新频率（1/3/7天）
 */
export async function scheduleUpdateReminder(frequencyDays: number): Promise<void> {
  // 保存频率设置（无论是否支持通知都保存）
  await AsyncStorage.setItem(UPDATE_FREQUENCY_KEY, String(frequencyDays));
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');

  const Notifications = getNotifications();
  if (!Notifications) {
    console.log('[NotifyService] Expo Go 模式：通知设置已保存（打包后生效）');
    return;
  }

  // 先清除所有已注册的通知
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (frequencyDays <= 0) return;

  // 检查权限
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  // 注册定时通知
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '岗位猎手 🎯',
      body: '有新的高分子材料岗位更新啦，快来查看！',
      data: { type: 'update_reminder' },
    },
    trigger: {
      seconds: frequencyDays * 24 * 60 * 60,
      repeats: true,
    } as any,
  });

  console.log(`[NotifyService] 已注册定时通知：每 ${frequencyDays} 天`);
}

/**
 * 取消定时通知
 */
export async function cancelUpdateReminder(): Promise<void> {
  const Notifications = getNotifications();
  if (Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
  console.log('[NotifyService] 已取消所有定时通知');
}

/**
 * 读取当前更新频率（从持久化存储）
 */
export async function getUpdateFrequency(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(UPDATE_FREQUENCY_KEY);
    return raw ? parseInt(raw, 10) : 3; // 默认 3 天
  } catch {
    return 3;
  }
}

/**
 * 读取通知是否启用
 */
export async function isNotificationEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return raw === 'true';
  } catch {
    return true; // 默认启用
  }
}

/**
 * 立即发送一条"新岗位"通知（用于测试）
 */
export async function sendTestNotification(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('[NotifyService] 通知权限未授予');
      return false;
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '岗位猎手 🎯',
      body: '这是一条测试通知，确认推送功能正常',
      data: { type: 'test' },
    },
    trigger: null, // 立即发送
  });
  return true;
}
