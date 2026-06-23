import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Job } from '../../types/job';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useJobs } from '../../contexts/JobsContext';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { jobs, getJobById } = useJobs();
  const { isFavorited, toggleFavorite } = useFavorites();

  // 根据ID获取岗位数据
  const job = getJobById(id) || jobs[0];
  const favorited = isFavorited(job?.id || '');

  // 返回
  const handleBack = () => {
    router.back();
  };

  // 收藏/取消收藏
  const handleFavorite = () => {
    toggleFavorite(job.id);
  };

  // 一键投递 → 打开原文链接
  const handleApply = async () => {
    if (job.detailUrl && job.detailUrl !== '' && job.detailUrl !== '未知') {
      try {
        const canOpen = await Linking.canOpenURL(job.detailUrl);
        if (canOpen) {
          await Linking.openURL(job.detailUrl);
        } else {
          Alert.alert('无法打开链接', '该链接格式不支持，请手动复制：\n' + job.detailUrl);
        }
      } catch (e) {
        Alert.alert('打开失败', '请检查网络后重试');
      }
    } else {
      Alert.alert('暂无投递链接', '该岗位暂无在线投递渠道，建议通过单位官网或邮件联系。');
    }
  };

  // 获取截止日期状态
  const getDeadlineStatus = () => {
    if (!job.deadline || job.deadline === '未知') return { text: '未知', color: '#999' };
    const deadline = new Date(job.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: '已截止', color: '#999' };
    if (diffDays <= 3) return { text: `还有${diffDays}天截止`, color: '#c62828' };
    if (diffDays <= 7) return { text: `还有${diffDays}天截止`, color: '#f57c00' };
    return { text: job.deadline, color: '#2e7d32' };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 返回</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFavorite}>
            <Text style={styles.favoriteBtn}>{favorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.company}>{job.company} · {job.region}</Text>
        <Text style={styles.title}>{job.title}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.education}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.region}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.jobType}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>学历要求</Text>
              <Text style={styles.infoValue}>{job.education}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>专业要求</Text>
              <Text style={styles.infoValue}>{job.major}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>工作地点</Text>
              <Text style={styles.infoValue}>{job.region}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>发布日期</Text>
              <Text style={styles.infoValue}>{job.publishDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>截止日期</Text>
              <Text style={[styles.infoValue, { color: deadlineStatus.color }]}>
                {deadlineStatus.text}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>招聘状态</Text>
              <Text style={[styles.infoValue, { color: job.status === '进行中' ? '#2e7d32' : '#999' }]}>
                {job.status}
              </Text>
            </View>
            {job.salary && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>薪资待遇</Text>
                <Text style={[styles.infoValue, { color: '#1a73e8' }]}>{job.salary}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 岗位描述 */}
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>岗位描述</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        )}

        {/* 任职要求 */}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>任职要求</Text>
            <Text style={styles.description}>{job.requirements}</Text>
          </View>
        )}

        {/* 福利待遇 */}
        {job.benefits && job.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>福利待遇</Text>
            <View style={styles.benefitsContainer}>
              {job.benefits.map((benefit: string, index: number) => (
                <View key={index} style={styles.benefitTag}>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 原文链接 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>原文链接</Text>
          <TouchableOpacity
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <View style={styles.linkCard}>
              <Text style={styles.linkIcon}>🔗</Text>
              <Text style={styles.link} numberOfLines={2}>
                {job.detailUrl !== '未知' ? job.detailUrl : '暂无链接'}
              </Text>
              <Text style={styles.linkArrow}>→</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.linkHint}>点击上方卡片可在浏览器中打开原文</Text>
        </View>

        {/* 底部占位，避免被操作栏遮挡 */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFavorite}>
          <Text style={styles.secondaryBtnText}>{favorited ? '❤️ 已收藏' : '收藏'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleApply}>
          <Text style={styles.primaryBtnText}>一键投递</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 24,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  favoriteBtn: {
    fontSize: 24,
    padding: 8,
  },
  company: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    lineHeight: 30,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: 12,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '45%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benefitTag: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
  },
  benefitText: {
    fontSize: 13,
    color: '#2e7d32',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  linkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  link: {
    flex: 1,
    fontSize: 13,
    color: '#1a73e8',
  },
  linkArrow: {
    fontSize: 16,
    color: '#1a73e8',
    marginLeft: 8,
  },
  linkHint: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  primaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
