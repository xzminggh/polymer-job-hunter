// 岗位数据类型定义
export interface Job {
  id: string;
  company: string;
  title: string;
  education: string;
  major: string;
  region: string;
  publishDate: string;
  deadline: string;
  detailUrl: string;
  status: '进行中' | '已截止' | '未知';
  category: '企业' | '研究院/事业单位';
  jobType: '研发类' | '工程类' | '研究员/专家' | '博士后' | '管理类' | '技术类';
  isNew?: boolean;
  isUrgent?: boolean;
  description?: string;
  requirements?: string;
  salary?: string;
  benefits?: string[];
}

// 筛选条件类型
export interface FilterCriteria {
  city: string[];
  education: string[];
  jobType: string[];
  category: string[];
  publishDateRange: string;
  keyword: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'deadline' | 'new_job' | 'recommendation' | 'update';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  jobId?: string;
}

// 用户偏好设置
export interface UserPreferences {
  enableDeadlineReminder: boolean;
  enableNewJobPush: boolean;
  enableWeeklyRecommendation: boolean;
  reminderDays: number;
  targetCities: string[];
  minEducation: string;
  majorDirections: string[];
  updateFrequency: number; // 天数
}
