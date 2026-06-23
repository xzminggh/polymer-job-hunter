// 定时更新通知服务 — 用本地推送提醒用户打开 App 检查新岗位
// ⚠️ expo-notifications 在 Expo Go (SDK 53+) 中不可用
// 采用懒加载：Expo Go 中自动降级为无通知模式，Development Build 中正常工作

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 配置 ─────────────────────────────────────────────────

const UPDATE_FREQUENCY_KEY = 'job_hunter_update_frequency_days';
const NOTIFICATION_ENABLED_KEY = 'job_hunter_notification_enabled';
const LAST_NOTIFY_KEY = 'job_hunter_last_notify_time';

// ── 懒加载 expo-notifications ──────────────────────────────
// Expo Go 中 require 会抛异常，用 try-catch 降级

let _Notifications: any = null;
let _initialized = false;

function getNotifications(): any {
  if (_initialized) return _Notifications;
  _initialized = true;

  try {
    const Notifications = require('expo-notifications');
    // 设置通知前台展示方式
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    _Notifications = Notifications;
  } catch (e) {
    console.warn('[NotifyService] expo-notifications 不可用（Expo Go 模式），通知功能降级');
    _Notifications = null;
  }
  return _Notifications;
}

/**
 * 通知功能是否可用（Expo Go 中返回 false，Development Build 中返回 true）
 */
export function isNotificationsSupported(): boolean {
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
  const Notifications = getNotifications();
  if (!Notifications) {
    // Expo Go 降级：只保存设置，不实际注册通知
    await AsyncStorage.setItem(UPDATE_FREQUENCY_KEY, String(frequencyDays));
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
    console.log('[NotifyService] Expo Go 模式：通知设置已保存（需 Development Build 才能实际推送）');
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

  // 保存频率设置
  await AsyncStorage.setItem(UPDATE_FREQUENCY_KEY, String(frequencyDays));
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');

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
