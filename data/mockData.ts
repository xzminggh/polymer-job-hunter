import { Job, Notification } from '../types/job';

// 模拟岗位数据（基于真实采集的46条数据）
export const mockJobs: Job[] = [
  {
    id: '1',
    company: '普利特',
    title: '高分子材料研发工程师',
    education: '硕士及以上',
    major: '高分子/材料',
    region: '上海',
    publishDate: '2026-06-15',
    deadline: '2026-08-11',
    detailUrl: 'https://example.com/job/1',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: true,
    description: '1. 负责高分子材料产品研发\n2. 参与新材料配方设计与优化\n3. 协助完成产品性能测试与数据分析\n4. 跟踪行业前沿技术动态',
    requirements: '1. 硕士及以上学历，高分子材料、材料科学等相关专业\n2. 熟悉高分子材料基本理论与测试方法\n3. 具有良好的实验操作能力和数据分析能力',
    salary: '15-25K/月',
    benefits: ['五险一金', '年终奖', '股票期权', '带薪年假']
  },
  {
    id: '2',
    company: '海利得',
    title: '产品开发工程师',
    education: '硕士',
    major: '高分子/化工',
    region: '浙江嘉兴',
    publishDate: '2026-06-10',
    deadline: '2026-07-30',
    detailUrl: 'https://example.com/job/2',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责新产品开发项目的规划与执行\n2. 进行产品性能测试与改进\n3. 参与客户需求沟通与技术支持',
    requirements: '1. 硕士学历，高分子材料、化学工程等相关专业\n2. 具有良好的沟通能力和团队合作精神',
    salary: '12-20K/月',
    benefits: ['五险一金', '免费住宿', '餐补', '交通补贴']
  },
  {
    id: '3',
    company: '中科院化学研究所',
    title: '博士后研究员（高分子方向）',
    education: '博士',
    major: '高分子/化学',
    region: '北京',
    publishDate: '2026-06-08',
    deadline: '2026-06-21',
    detailUrl: 'https://example.com/job/3',
    status: '进行中',
    category: '研究院/事业单位',
    jobType: '博士后',
    isUrgent: true,
    description: '1. 开展高分子材料前沿科学研究\n2. 发表高水平学术论文\n3. 参与国家级科研项目',
    requirements: '1. 博士学历，高分子科学、物理化学等相关专业\n2. 具有良好的科研能力和英语阅读能力',
    salary: '25-35K/月',
    benefits: ['博士后公寓', '科研启动经费', '国际交流机会']
  },
  {
    id: '4',
    company: '苏博特',
    title: '新材料研发工程师',
    education: '硕士',
    major: '材料/化学',
    region: '江苏南京',
    publishDate: '2026-06-05',
    deadline: '2026-08-15',
    detailUrl: 'https://example.com/job/4',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责新材料产品研发\n2. 参与产品性能测试与优化\n3. 协助完成技术文档编写',
    requirements: '1. 硕士学历，材料科学与工程、化学等相关专业\n2. 熟悉材料测试表征方法',
    salary: '13-22K/月',
    benefits: ['五险一金', '年终奖', '培训机会']
  },
  {
    id: '5',
    company: '甬江实验室',
    title: '特聘研究员（材料基因组）',
    education: '博士',
    major: '材料/化学',
    region: '浙江宁波',
    publishDate: '2026-06-01',
    deadline: '2026-12-31',
    detailUrl: 'https://example.com/job/5',
    status: '进行中',
    category: '研究院/事业单位',
    jobType: '研究员/专家',
    isNew: false,
    description: '1. 开展材料基因组工程前沿研究\n2. 组建独立科研团队\n3. 申请国家级科研项目',
    requirements: '1. 博士学历，材料科学、化学、物理等相关专业\n2. 具有良好的科研业绩和国际合作能力',
    salary: '40-60K/月',
    benefits: ['科研启动经费', '人才公寓', '子女教育支持']
  },
  {
    id: '6',
    company: '恒逸研究院',
    title: '研发工程师（化纤新材料）',
    education: '硕士及以上',
    major: '高分子/材料',
    region: '浙江杭州',
    publishDate: '2026-05-28',
    deadline: '2026-07-15',
    detailUrl: 'https://example.com/job/6',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责化纤新材料产品研发\n2. 参与生产工艺优化\n3. 协助完成产品性能测试',
    requirements: '1. 硕士及以上学历，高分子材料、纺织工程等相关专业\n2. 熟悉化纤材料基本理论与测试方法',
    salary: '14-23K/月',
    benefits: ['五险一金', '年终奖', '人才房补贴']
  },
  {
    id: '7',
    company: '润禾材料',
    title: '有机硅研发工程师',
    education: '硕士',
    major: '高分子/化工',
    region: '浙江嘉兴',
    publishDate: '2026-05-25',
    deadline: '2026-08-01',
    detailUrl: 'https://example.com/job/7',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责有机硅材料产品研发\n2. 参与产品性能测试与改进\n3. 跟踪行业前沿技术动态',
    requirements: '1. 硕士学历，高分子材料、化学工程等相关专业\n2. 熟悉有机硅材料基本理论与应用',
    salary: '12-20K/月',
    benefits: ['五险一金', '餐补', '住宿补贴']
  },
  {
    id: '8',
    company: '福斯特',
    title: '高分子材料研发工程师',
    education: '硕士及以上',
    major: '高分子/材料',
    region: '浙江杭州',
    publishDate: '2026-05-20',
    deadline: '2026-07-31',
    detailUrl: 'https://example.com/job/8',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责光伏材料产品研发\n2. 参与新材料配方设计与优化\n3. 协助完成产品性能测试与数据分析',
    requirements: '1. 硕士及以上学历，高分子材料、材料科学等相关专业\n2. 熟悉光伏材料基本理论与测试方法',
    salary: '15-25K/月',
    benefits: ['五险一金', '年终奖', '股票期权']
  },
  {
    id: '9',
    company: '中石化（上海）石油化工研究院',
    title: '科研专家（高分子材料）',
    education: '博士',
    major: '高分子/化学',
    region: '上海',
    publishDate: '2026-05-18',
    deadline: '2026-08-11',
    detailUrl: 'https://example.com/job/9',
    status: '进行中',
    category: '研究院/事业单位',
    jobType: '研究员/专家',
    isNew: false,
    description: '1. 开展高分子材料前沿科学研究\n2. 申请国家级科研项目\n3. 指导研究生和青年科研人员',
    requirements: '1. 博士学历，高分子科学、化学工程等相关专业\n2. 具有良好的科研业绩和团队管理能力',
    salary: '40-80K/月',
    benefits: ['科研启动经费', '人才公寓', '子女教育支持']
  },
  {
    id: '10',
    company: '瀚海新材料',
    title: '材料研发工程师',
    education: '硕士',
    major: '材料/化学',
    region: '江苏苏州',
    publishDate: '2026-05-15',
    deadline: '2026-07-20',
    detailUrl: 'https://example.com/job/10',
    status: '进行中',
    category: '企业',
    jobType: '研发类',
    isNew: false,
    description: '1. 负责新材料产品研发\n2. 参与产品性能测试与优化\n3. 协助完成技术文档编写',
    requirements: '1. 硕士学历，材料科学与工程、化学等相关专业\n2. 熟悉材料测试表征方法',
    salary: '13-22K/月',
    benefits: ['五险一金', '年终奖', '培训机会']
  }
];

// 模拟通知数据
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'deadline',
    title: '截止提醒',
    description: '中科院化学所 - 博士后研究员岗位将在3天后截止投递，抓紧！',
    timestamp: '2026-06-18 09:38',
    isRead: false,
    jobId: '3'
  },
  {
    id: '2',
    type: 'new_job',
    title: '新岗位发布',
    description: '普利特发布了2个新岗位：高分子材料研发工程师、产品开发工程师',
    timestamp: '2026-06-18 08:30',
    isRead: false,
    jobId: '1'
  },
  {
    id: '3',
    type: 'recommendation',
    title: '每周推荐',
    description: '本周为你推荐优先投递的3个岗位：甬江实验室、中科院化学所、普利特',
    timestamp: '2026-06-17 09:00',
    isRead: true
  },
  {
    id: '4',
    type: 'update',
    title: '数据更新完成',
    description: '本次更新新增12个岗位，当前共60个有效岗位等你来看',
    timestamp: '2026-06-17 08:00',
    isRead: true
  }
];

// 获取所有城市列表
export const getCities = (): string[] => {
  const cities = new Set(mockJobs.map(job => job.region));
  return Array.from(cities);
};

// 获取所有岗位类型
export const getJobTypes = (): string[] => {
  const types = new Set(mockJobs.map(job => job.jobType));
  return Array.from(types);
};

// 筛选岗位
export const filterJobs = (jobs: Job[], criteria: Partial<{
  city: string[];
  education: string[];
  jobType: string[];
  category: string[];
  keyword: string;
}>): Job[] => {
  return jobs.filter(job => {
    // 城市筛选
    if (criteria.city && criteria.city.length > 0 && !criteria.city.includes(job.region)) {
      return false;
    }

    // 学历筛选
    if (criteria.education && criteria.education.length > 0) {
      const hasMatch = criteria.education.some(edu => job.education.includes(edu));
      if (!hasMatch) return false;
    }

    // 岗位类型筛选
    if (criteria.jobType && criteria.jobType.length > 0 && !criteria.jobType.includes(job.jobType)) {
      return false;
    }

    // 单位类型筛选
    if (criteria.category && criteria.category.length > 0 && !criteria.category.includes(job.category)) {
      return false;
    }

    // 关键词搜索
    if (criteria.keyword && criteria.keyword.trim() !== '') {
      const keyword = criteria.keyword.toLowerCase();
      const searchText = `${job.title} ${job.company} ${job.major} ${job.region}`.toLowerCase();
      if (!searchText.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
};
