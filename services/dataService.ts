// 远程数据服务 — 从 GitHub Raw 拉取最新岗位数据
// 支持版本检查、本地缓存、网络失败降级

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/job';

// ── 配置 ─────────────────────────────────────────
// GitHub Raw URL（需替换为实际仓库路径）
// 格式：https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
const REMOTE_BASE = 'https://raw.githubusercontent.com';
const REMOTE_REPO = 'xzming/polymer-job-hunter/main/recruitment-app/data';

// 轻量元数据（仅版本号，快速检查是否需要更新）
const META_URL = `${REMOTE_BASE}/${REMOTE_REPO}/jobs-meta.json`;

// 完整数据
const DATA_URL = `${REMOTE_BASE}/${REMOTE_REPO}/realJobs.json`;

// 本地缓存 key
const CACHE_KEY = 'job_hunter_remote_data';
const META_CACHE_KEY = 'job_hunter_remote_meta';
const LAST_CHECK_KEY = 'job_hunter_last_check';

// 检查更新间隔（毫秒），默认 6 小时
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

// ── 类型定义 ─────────────────────────────────────
export interface JobsMetaData {
  version: string;       // '20260621'
  generatedAt: string;   // '2026-06-21 08:00:00'
  count: number;
}

export interface RemoteJobsData {
  version: string;
  generatedAt: string;
  count: number;
  jobs: Job[];
}

// ── 工具函数 ─────────────────────────────────────

/**
 * 获取元数据（轻量，快速判断是否有更新）
 */
export async function fetchMeta(): Promise<JobsMetaData | null> {
  try {
    const res = await fetch(META_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 获取完整岗位数据（远程）
 */
async function fetchRemoteData(): Promise<RemoteJobsData | null> {
  try {
    const res = await fetch(DATA_URL, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(8000), // 8秒超时
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 读取本地缓存
 */
async function getCachedData(): Promise<RemoteJobsData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 写入本地缓存
 */
async function setCachedData(data: RemoteJobsData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(META_CACHE_KEY, JSON.stringify({
      version: data.version,
      generatedAt: data.generatedAt,
      count: data.count,
    }));
  } catch (e) {
    console.warn('[DataService] 缓存写入失败:', e);
  }
}

/**
 * 获取最后检查时间
 */
async function getLastCheckTime(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LAST_CHECK_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function setLastCheckTime(t: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(t));
  } catch {}
}

// ── 核心 API ─────────────────────────────────────

/**
 * 智能更新：比较版本，仅在有更新时下载完整数据
 * 返回：{ updated, data, error }
 */
export async function smartUpdate(): Promise<{
  updated: boolean;
  data: RemoteJobsData | null;
  error?: string;
}> {
  try {
    // 1. 获取远程元数据（轻量）
    const remoteMeta = await fetchMeta();
    if (!remoteMeta) {
      // 网络失败，使用缓存
      const cached = await getCachedData();
      return { updated: false, data: cached ?? null, error: '无法连接更新服务器' };
    }

    // 2. 获取本地缓存的元数据
    const cachedMetaRaw = await AsyncStorage.getItem(META_CACHE_KEY);
    const cachedMeta: JobsMetaData | null = cachedMetaRaw ? JSON.parse(cachedMetaRaw) : null;

    // 3. 比较版本
    if (cachedMeta && cachedMeta.version >= remoteMeta.version) {
      // 已是最新，直接返回缓存
      const cached = await getCachedData();
      return { updated: false, data: cached };
    }

    // 4. 版本较旧，下载完整数据
    const remoteData = await fetchRemoteData();
    if (!remoteData) {
      const cached = await getCachedData();
      return { updated: false, data: cached ?? null, error: '下载更新数据失败' };
    }

    // 5. 写入缓存
    await setCachedData(remoteData);
    await setLastCheckTime(Date.now());

    return { updated: true, data: remoteData };
  } catch (e: any) {
    const cached = await getCachedData();
    return { updated: false, data: cached ?? null, error: String(e) };
  }
}

/**
 * 强制从远程拉取最新数据（手动刷新用）
 */
export async function forceRefresh(): Promise<{
  success: boolean;
  data: RemoteJobsData | null;
  message: string;
}> {
  try {
    const remoteData = await fetchRemoteData();
    if (!remoteData) {
      return { success: false, data: null, message: '网络异常，无法获取最新数据' };
    }
    await setCachedData(remoteData);
    await setLastCheckTime(Date.now());
    return { success: true, data: remoteData, message: `已更新 ${remoteData.count} 条岗位数据` };
  } catch (e: any) {
    return { success: false, data: null, message: `更新失败: ${e.message}` };
  }
}

/**
 * 获取当前生效的数据（远程缓存优先，降级到 bundled）
 */
export async function getActiveData(): Promise<{
  data: RemoteJobsData;
  source: 'remote' | 'bundled';
}> {
  // 先尝试远程缓存
  const cached = await getCachedData();
  if (cached && cached.jobs && cached.jobs.length > 0) {
    return { data: cached, source: 'remote' };
  }
  // 降级到 bundled 数据
  const bundled = require('../data/realJobs.json');
  // bundled 格式可能是直接数组，也可能是 { jobs: [] }
  const jobsData = bundled.jobs ? bundled : { jobs: bundled, version: 'bundled', generatedAt: '未知', count: bundled.length };
  return { data: jobsData, source: 'bundled' };
}

/**
 * 检查是否需要更新（基于时间间隔）
 */
export async function shouldCheckUpdate(): Promise<boolean> {
  const last = await getLastCheckTime();
  return Date.now() - last > CHECK_INTERVAL;
}

/**
 * 获取最后更新时间（展示用）
 */
export async function getLastUpdateTime(): Promise<string> {
  try {
    const cached = await getCachedData();
    if (cached?.generatedAt) return cached.generatedAt;
    const meta = await AsyncStorage.getItem(META_CACHE_KEY);
    if (meta) {
      const m = JSON.parse(meta);
      return m.generatedAt || '未知';
    }
    return '未知';
  } catch {
    return '未知';
  }
}

/**
 * 获取数据来源信息（用于 UI 展示）
 */
export async function getDataSourceInfo(): Promise<{
  source: string;
  version: string;
  count: number;
}> {
  const cached = await getCachedData();
  if (cached) {
    return { source: '远程更新', version: cached.version, count: cached.count };
  }
  return { source: '本地内置', version: '—', count: 0 };
}
