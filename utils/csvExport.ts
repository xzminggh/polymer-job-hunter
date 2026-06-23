// CSV导出工具 — 将岗位数据导出为CSV文件并分享保存
// 支持中文Excel兼容（BOM头 + UTF-8编码）

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Job } from '../types/job';

// CSV列头（中文，便于用户在Excel中查看）
const CSV_HEADERS = [
  '公司名称',
  '职位名称',
  '学历要求',
  '专业方向',
  '工作地区',
  '薪资待遇',
  '发布日期',
  '截止日期',
  '岗位状态',
  '单位类别',
  '岗位类型',
  '详情链接',
];

// 将单个字段转义为CSV安全格式
function escapeCsvField(value: string | undefined | null): string {
  if (value === undefined || value === null) return '';
  // 如果字段包含逗号、引号或换行符，用双引号包裹，内部引号转义为双引号
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 将岗位数组转换为CSV字符串（含BOM头）
function jobsToCsv(jobs: Job[]): string {
  // BOM头：让Excel正确识别UTF-8编码
  let csv = '\ufeff';
  
  // 添加列头
  csv += CSV_HEADERS.join(',') + '\r\n';
  
  // 添加数据行
  for (const job of jobs) {
    const row = [
      escapeCsvField(job.company),
      escapeCsvField(job.title),
      escapeCsvField(job.education),
      escapeCsvField(job.major),
      escapeCsvField(job.region),
      escapeCsvField(job.salary),
      escapeCsvField(job.publishDate),
      escapeCsvField(job.deadline),
      escapeCsvField(job.status),
      escapeCsvField(job.category),
      escapeCsvField(job.jobType),
      escapeCsvField(job.detailUrl),
    ];
    csv += row.join(',') + '\r\n';
  }
  
  return csv;
}

// 生成文件名（含时间戳）
function generateFileName(jobCount: number): string {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `高分子材料岗位_${jobCount}个_${timestamp}.csv`;
}

// 导出岗位数据为CSV文件并触发分享/保存
export async function exportJobsToCsv(jobs: Job[]): Promise<{ success: boolean; message: string }> {
  if (!jobs || jobs.length === 0) {
    return { success: false, message: '没有可导出的岗位数据' };
  }

  try {
    // 1. 生成CSV内容
    const csvContent = jobsToCsv(jobs);
    
    // 2. 写入临时文件
    const fileName = generateFileName(jobs.length);
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // 3. 检查分享是否可用
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: '当前设备不支持文件分享，请在真实设备上使用' };
    }
    
    // 4. 触发分享/保存对话框
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: '保存岗位信息到手机',
      UTI: 'public.comma-separated-values-text', // iOS
    });
    
    return { success: true, message: `成功导出 ${jobs.length} 个岗位到 ${fileName}` };
  } catch (error: any) {
    console.error('CSV导出失败:', error);
    return { success: false, message: `导出失败: ${error.message || '未知错误'}` };
  }
}

// 导出类型供外部使用
export type ExportResult = { success: boolean; message: string };
