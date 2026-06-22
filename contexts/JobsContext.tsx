// 岗位数据全局 Context — 提供远程更新 + 本地 bundled 降级
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/job';

// ── 类型 ─────────────────────────────────────────────────────

export interface RemoteJobsData {
  version: string;
  generatedAt: string;
  count: number;
  jobs: Job[];
}

interface JobsContextValue {
  jobs: Job[];                  // 当前生效的岗位列表
  loading: boolean;              // 是否正在加载/更新
  lastUpdate: string;            // 最后更新时间描述
  dataSource: 'bundled' | 'remote'; // 数据来源
  refresh: () => Promise<void>;  // 手动刷新
  getJobById: (id: string) => Job | undefined;
}

// ── 远程配置 ─────────────────────────────────────────────────
// 替换为实际的 GitHub Raw URL
const META_URL =
  'https://raw.githubusercontent.com/xzming/polymer-job-hunter/main/recruitment-app/data/jobs-meta.json';
const DATA_URL =
  'https://raw.githubusercontent.com/xzming/polymer-job-hunter/main/recruitment-app/data/realJobs.json';

const CACHE_KEY = 'job_hunter_remote_data';
const META_CACHE_KEY = 'job_hunter_remote_meta';
const LAST_CHECK_KEY = 'job_hunter_last_check';
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 小时

// ── 工具函数 ────────────────────────────────────────────────

async function fetchJson(url: string, timeout = 8000): Promise<any> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}

async function getCached(): Promise<RemoteJobsData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function setCached(data: RemoteJobsData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(META_CACHE_KEY, JSON.stringify({
      version: data.version,
      generatedAt: data.generatedAt,
      count: data.count,
    }));
  } catch {}
}

// ── Context ──────────────────────────────────────────────────

const JobsContext = createContext<JobsContextValue | null>(null);

// 加载 bundled 数据（静态 require，始终可用）
function loadBundled(): RemoteJobsData {
  try {
    const raw = require('../data/realJobs.json');
    if (raw.jobs) return raw as RemoteJobsData;
    return { version: 'bundled', generatedAt: '—', count: raw.length, jobs: raw };
  } catch {
    return { version: 'empty', generatedAt: '—', count: 0, jobs: [] };
  }
}

// ── Provider ─────────────────────────────────────────────────

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(() => loadBundled().jobs);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('未知');
  const [dataSource, setDataSource] = useState<'bundled' | 'remote'>('bundled');

  // 智能更新：比较版本号，仅必要时下载完整数据
  const smartUpdate = useCallback(async (force = false) => {
    setLoading(true);
    try {
      // 1. 获取远程元数据
      const remoteMeta = await fetchJson(META_URL);
      if (!remoteMeta) {
        // 网络失败，尝试使用缓存
        const cached = await getCached();
        if (cached) {
          setJobs(cached.jobs);
          setDataSource('remote');
          setLastUpdate(cached.generatedAt);
        }
        setLoading(false);
        return;
      }

      // 2. 读取本地缓存元数据
      const cachedMetaRaw = await AsyncStorage.getItem(META_CACHE_KEY);
      const cachedMeta = cachedMetaRaw ? JSON.parse(cachedMetaRaw) : null;

      // 3. 判断是否需要更新
      if (!force && cachedMeta && cachedMeta.version >= remoteMeta.version) {
        const cached = await getCached();
        if (cached) {
          setJobs(cached.jobs);
          setDataSource('remote');
          setLastUpdate(cached.generatedAt);
        }
        setLoading(false);
        return;
      }

      // 4. 下载完整数据
      const remoteData = await fetchJson(DATA_URL, 15000);
      if (remoteData?.jobs) {
        await setCached(remoteData);
        await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
        setJobs(remoteData.jobs);
        setDataSource('remote');
        setLastUpdate(remoteData.generatedAt);
      } else {
        // 下载失败，降级到缓存或 bundled
        const cached = await getCached();
        if (cached) {
          setJobs(cached.jobs);
          setDataSource('remote');
        }
      }
    } catch (e) {
      console.warn('[JobsProvider] 更新失败：', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 手动刷新
  const refresh = useCallback(async () => {
    await smartUpdate(true);
  }, [smartUpdate]);

  // 启动时执行一次智能更新
  useEffect(() => {
    smartUpdate();
    // 读取展示用更新时间
    AsyncStorage.getItem(META_CACHE_KEY).then(raw => {
      if (raw) {
        const m = JSON.parse(raw);
        setLastUpdate(m.generatedAt || '未知');
      }
    });
  }, [smartUpdate]);

  const value: JobsContextValue = {
    jobs,
    loading,
    lastUpdate,
    dataSource,
    refresh,
    getJobById: (id: string) => jobs.find(j => j.id === id),
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
