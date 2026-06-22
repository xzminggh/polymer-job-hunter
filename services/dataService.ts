// 远程数据服务 — 从 CDN 拉取最新岗位数据
// 支持版本检查、本地缓存、网络失败降级

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/job';

// ── 配置 ─────────────────────────────────────────
// 三级数据源：jsdelivr CDN（国内最快）→ Gitee Raw → GitHub Raw（国际降级）
// 注意：Gitee Raw 对较大 JSON 文件会触发内容审核（HTTP 451），仅用于 meta 小文件
const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/xzminggh/polymer-job-hunter@master/data';
const GITEE_BASE = 'https://gitee.com/xzmingmy/polymer-job-hunter/raw/master/data';
const GITHUB_BASE = 'https://raw.githubusercontent.com/xzminggh/polymer-job-hunter/master/data';

// 数据源优先级列表（meta 用全部，data 用 CDN + GitHub）
const META_SOURCES = [JSDELIVR_BASE, GITEE_BASE, GITHUB_BASE];
const DATA_SOURCES = [JSDELIVR_BASE, GITHUB_BASE]; // Gitee 排除（451审核拦截）

let activeSource = JSDELIVR_BASE;

// 轻量元数据（仅版本号，快速检查是否需要更新）
const META_FILE = 'jobs-meta.json';
const DATA_FILE = 'realJobs.json';

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
 * 通用多源获取：按优先级依次尝试，返回第一个成功的
 */
async function fetchFromSources(
  file: string,
  sources: string[],
  timeout = 12000,
): Promise<{ data: any; source: string } | null> {
  for (const base of sources) {
    try {
      const res = await fetch(`${base}/${file}`, {
        cache: 'no-cache',
        signal: AbortSignal.timeout(timeout),
      });
      if (res.ok) {
        activeSource = base;
        return { data: await res.json(), source: base };
      }
    } catch {
      continue; // 超时或网络错误，尝试下一个源
    }
  }
  return null;
}

/**
 * 获取元数据（轻量，快速判断是否有更新）
 * 三源降级：jsdelivr → Gitee → GitHub
 */
export async function fetchMeta(): Promise<JobsMetaData | null> {
  const result = await fetchFromSources(META_FILE, META_SOURCES, 6000);
  return result ? result.data : null;
}

/**
 * 获取完整岗位数据（远程）
 * 两源降级：jsdelivr → GitHub（Gitee因451审核排除）
 */
async function fetchRemoteData(): Promise<RemoteJobsData | null> {
  const result = await fetchFromSources(DATA_FILE, DATA_SOURCES);
  return result ? result.data : null;
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
