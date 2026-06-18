// 真实岗位数据（从 CSV 转换）
// 使用 require 直接导入 JSON，Expo/Metro 会自动处理
let realJobsJson: any[] = [];
try {
  realJobsJson = require('./realJobs.json');
} catch (e) {
  console.warn('Failed to load realJobs.json:', e);
}

export const realJobs = realJobsJson;

// 获取所有城市列表（去重 + 排序）
export const getCities = (): string[] => {
  try {
    const cities = new Set(realJobsJson.map((job: any) => job.region));
    return Array.from(cities).sort() as string[];
  } catch {
    return [];
  }
};

// 获取所有岗位类型
export const getJobTypes = (): string[] => {
  try {
    const types = new Set(realJobsJson.map((job: any) => job.jobType));
    return Array.from(types) as string[];
  } catch {
    return [];
  }
};

// 获取所有学历选项
export const getEducationOptions = (): string[] => {
  try {
    const edus = new Set(realJobsJson.map((job: any) => job.education));
    return Array.from(edus) as string[];
  } catch {
    return [];
  }
};

// 统一筛选条件接口
export interface SearchCriteria {
  keyword?: string;
  city?: string;           // 单选，空字符串 = 全部
  education?: string;      // 单选，空字符串 = 全部
  jobType?: string;        // 单选，空字符串 = 全部
  category?: string;       // 单选，空字符串 = 全部
  publishDateRange?: string; // '全部' | '近3天' | '近7天' | '近30天'
}

// 统一筛选函数
export const filterJobs = (jobs: any[], criteria: SearchCriteria): any[] => {
  return jobs.filter((job: any) => {
    // 关键词搜索（岗位名称 + 单位名称 + 专业 + 城市）
    if (criteria.keyword && criteria.keyword.trim() !== '') {
      const kw = criteria.keyword.toLowerCase().trim();
      const searchText = `${job.title} ${job.company} ${job.major} ${job.region}`.toLowerCase();
      if (!searchText.includes(kw)) return false;
    }

    // 地点（单选）
    if (criteria.city && criteria.city !== '' && job.region !== criteria.city) {
      return false;
    }

    // 学历（单选，支持包含匹配）
    if (criteria.education && criteria.education !== '' && criteria.education !== '不限') {
      if (!job.education.includes(criteria.education)) return false;
    }

    // 岗位类型（单选）
    if (criteria.jobType && criteria.jobType !== '' && job.jobType !== criteria.jobType) {
      return false;
    }

    // 单位类型（单选）
    if (criteria.category && criteria.category !== '' && criteria.category !== '全部') {
      // 简化匹配：企业/研究院/高校
      if (criteria.category === '企业' && job.category !== '企业') return false;
      if (criteria.category === '研究院' && !job.category.includes('研究院')) return false;
      if (criteria.category === '高校' && !job.company.includes('大学') && !job.company.includes('学院')) return false;
    }

    // 发布时间范围
    if (criteria.publishDateRange && criteria.publishDateRange !== '全部') {
      const days = criteria.publishDateRange === '近3天' ? 3 :
                   criteria.publishDateRange === '近7天' ? 7 :
                   criteria.publishDateRange === '近30天' ? 30 : 0;
      if (days > 0) {
        const publishDate = new Date(job.publishDate);
        const now = new Date();
        const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }
    }

    return true;
  });
};
