import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Job } from '../types/job';

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
  onFavorite?: (jobId: string) => void;
  isFavorited?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onPress, onFavorite, isFavorited = false }) => {
  const getBadgeStyle = () => {
    if (job.isUrgent) return styles.badgeUrgent;
    if (job.isNew) return styles.badgeNew;
    return styles.badgeNormal;
  };

  const getBadgeText = () => {
    if (job.isUrgent) return '即将截止';
    if (job.isNew) return '新发布';
    return '进行中';
  };

  const getDaysUntilDeadline = (): number => {
    if (!job.deadline) return Infinity;
    const deadline = new Date(job.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilDeadline = getDaysUntilDeadline();
  const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline > 0;

  // 判断单位类型图标
  const getCompanyIcon = () => {
    if (job.category === '研究院/事业单位') return '🔬';
    return '🏢';
  };

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent]}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      {/* 单位名称 — 最突出 */}
      <View style={styles.companyRow}>
        <Text style={styles.companyIcon}>{getCompanyIcon()}</Text>
        <Text style={styles.companyName} numberOfLines={1}>{job.company}</Text>
        <View style={[styles.statusDot, job.category === '研究院/事业单位' ? styles.dotResearch : styles.dotEnterprise]} />
      </View>

      {/* 岗位名称 — 次要 */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <View style={[styles.badge, getBadgeStyle()]}>
          <Text style={styles.badgeText}>{getBadgeText()}</Text>
        </View>
      </View>

      {/* 地点 */}
      <Text style={styles.regionText}>📍 {job.region}</Text>

      {/* 标签行 */}
      <View style={styles.tags}>
        <View style={[styles.tag, styles.tagEducation]}>
          <Text style={styles.tagText}>{job.education}</Text>
        </View>
        <View style={[styles.tag]}>
          <Text style={styles.tagText}>{job.jobType}</Text>
        </View>
        {job.salary && (
          <View style={[styles.tag, styles.tagSalary]}>
            <Text style={styles.tagText}>{job.salary}</Text>
          </View>
        )}
        <View style={[styles.tag, styles.tagMajor]}>
          <Text style={styles.tagText} numberOfLines={1}>{job.major}</Text>
        </View>
      </View>

      {/* 紧急提醒 */}
      {isUrgent && (
        <View style={styles.urgentWarning}>
          <Text style={styles.urgentText}>⚠️ 将在{daysUntilDeadline}天后截止</Text>
        </View>
      )}

      {/* 底部：日期 + 收藏 */}
      <View style={styles.footer}>
        <Text style={styles.publishDate}>发布于 {job.publishDate}{job.deadline !== '未知' ? ` · 截止 ${job.deadline}` : ''}</Text>
        {onFavorite && (
          <TouchableOpacity onPress={() => onFavorite(job.id)}>
            <Text style={[styles.favoriteBtn, isFavorited && styles.favoriteBtnActive]}>
              {isFavorited ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardUrgent: {
    borderColor: '#ffcdd2',
    borderWidth: 2,
  },

  // 单位名称（最突出）
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a73e8',
    flex: 1,
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  dotResearch: {
    backgroundColor: '#7b1fa2',
  },
  dotEnterprise: {
    backgroundColor: '#2e7d32',
  },

  // 岗位名称（次要）
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
    lineHeight: 21,
  },

  // 地点
  regionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },

  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeNew: {
    backgroundColor: '#e8f5e9',
  },
  badgeUrgent: {
    backgroundColor: '#ffebee',
  },
  badgeNormal: {
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  tagEducation: {
    backgroundColor: '#e8f5e9',
  },
  tagSalary: {
    backgroundColor: '#fff3e0',
  },
  tagMajor: {
    backgroundColor: '#f3e5f5',
    maxWidth: 120,
  },
  tagText: {
    fontSize: 11,
    color: '#555',
  },

  urgentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  publishDate: {
    fontSize: 11,
    color: '#bbb',
  },
  favoriteBtn: {
    fontSize: 20,
  },
  favoriteBtnActive: {
    fontSize: 20,
  },
});

export default JobCard;
