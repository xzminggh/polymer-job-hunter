// 定时更新通知服务 — 用本地推送提醒用户打开 App 检查新岗位
// Android 后台 fetch 不可靠（Doze 模式），本地通知更稳定

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 配置 ─────────────────────────────────────────────────

const UPDATE_FREQUENCY_KEY = 'job_hunter_update_frequency_days';
const NOTIFICATION_ENABLED_KEY = 'job_hunter_notification_enabled';
const LAST_NOTIFY_KEY = 'job_hunter_last_notify_time';

// ── 通知处理器 ──────────────────────────────────────────────

// 设置通知前台展示方式（静默，不打断用户）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── 通知权限 ──────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
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
  // 先清除所有已注册的通知
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (frequencyDays <= 0) return;

  // 检查权限
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  // 计算下次触发时间：当天 9:00 AM
  const now = new Date();
  const nextTrigger = new Date(now);
  nextTrigger.setDate(nextTrigger.getDate() + frequencyDays);
  nextTrigger.setHours(9, 0, 0, 0); // 上午 9 点

  // 如果触发时间已过今天 9 点，就从明天开始
  if (nextTrigger <= now) {
    nextTrigger.setDate(nextTrigger.getDate() + 1);
  }

  // 注册定时通知
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '岗位猎手 🎯',
      body: '有新的高分子材料岗位更新啦，快来查看！',
      data: { type: 'update_reminder' },
    },
    trigger: {
      // 重复间隔（秒）
      seconds: frequencyDays * 24 * 60 * 60,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });

  // 保存频率设置
  await AsyncStorage.setItem(UPDATE_FREQUENCY_KEY, String(frequencyDays));
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');

  console.log(`[NotifyService] 已注册定时通知：每 ${frequencyDays} 天 9:00 AM`);
}

/**
 * 取消定时通知
 */
export async function cancelUpdateReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
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
export async function sendTestNotification(): Promise<void> {
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('[NotifyService] 通知权限未授予');
      return;
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
}
