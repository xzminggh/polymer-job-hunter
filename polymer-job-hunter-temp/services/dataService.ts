// 远程数据服务 — 从 Gitee 拉取最新岗位数据
// 支持版本检查、本地缓存、网络失败降级

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/job';

// ── 配置 ─────────────────────────────────────────
// 纯 Gitee 数据源（国内快速稳定）
// - meta 小文件：Gitee Raw（直接 JSON，最快）
// - data 大文件：Gitee API（base64 编码，绕过 451 内容审核，无大小限制）
const GITEE_BASE = 'https://gitee.com/xzmingmy/polymer-job-hunter/raw/master/data';
const GITEE_API_BASE = 'https://gitee.com/api/v5/repos/xzmingmy/polymer-job-hunter/contents/data';

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
 * Gitee Raw 获取小文件（meta）：直接返回 JSON
 */
async function fetchGiteeRaw(file: string, timeout = 8000): Promise<any> {
  try {
    const res = await fetch(`${GITEE_BASE}/${file}`, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Gitee API 获取大文件（data）：返回 base64 编码内容，绕过 451 内容审核
 */
async function fetchFromGiteeApi(file: string, timeout = 15000): Promise<any> {
  try {
    const res = await fetch(`${GITEE_API_BASE}/${file}?ref=master`, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    const wrapper = await res.json();
    if (!wrapper.content) return null;
    // Gitee API 返回 base64 编码的文件内容
    // atob 输出 Latin1 字符串，需转为 Uint8Array 后用 TextDecoder 正确解码 UTF-8（含中文）
    const binaryStr = atob(wrapper.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const jsonStr = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * 获取元数据（轻量，快速判断是否有更新）
 * 数据源：Gitee Raw
 */
export async function fetchMeta(): Promise<JobsMetaData | null> {
  return await fetchGiteeRaw(META_FILE, 6000);
}

/**
 * 获取完整岗位数据（远程）
 * 数据源：Gitee API（base64 编码，绕过 451 内容审核）
 */
async function fetchRemoteData(): Promise<RemoteJobsData | null> {
  return await fetchFromGiteeApi(DATA_FILE);
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
