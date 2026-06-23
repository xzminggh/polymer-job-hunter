import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useJobs } from '../../contexts/JobsContext';
import { Notification } from '../../types/job';

// ── 从真实数据动态生成通知 ──────────────────────────

function buildNotificationsFromJobs(
  jobs: ReturnType<typeof useJobs>,
  prevJobCountRef: React.MutableRefObject<number | null>,
): Notification[] {
  const notifs: Notification[] = [];
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  // 1) 数据更新通知（核心 — 始终显示最新真实数据）
  if (!jobs.loading && jobs.jobs.length > 0) {
    const isNew = prevJobCountRef.current !== null && jobs.jobs.length > prevJobCountRef.current;
    const addedCount = prevJobCountRef.current !== null
      ? Math.max(0, jobs.jobs.length - prevJobCountRef.current)
      : 0;

    // 根据数据源类型和是否新增选择描述文案
    let desc: string;
    if (jobs.dataSource === 'remote') {
      if (isNew && addedCount > 0) {
        desc = `数据已从远程更新，新增 ${addedCount} 个岗位，当前共 ${jobs.jobs.length} 个。更新时间：${jobs.lastUpdate}`;
      } else {
        desc = `远程数据已是最新，共 ${jobs.jobs.length} 个岗位。更新时间：${jobs.lastUpdate}`;
      }
    } else {
      desc = `当前使用内置数据，共 ${jobs.jobs.length} 个岗位。请检查网络连接以获取最新数据。`;
    }

    notifs.push({
      id: 'update-latest',
      type: 'update',
      title: isNew ? '发现新岗位' : '数据更新完成',
      description: desc,
      timestamp: fmt(now),
      isRead: false,
    });

    // 记录本次岗位数供下次对比
    prevJobCountRef.current = jobs.jobs.length;
  }

  // 2) 新增岗位详情（仅当有新增时展示）
  // 这里展示最近新增的几个岗位作为通知条目
  if (prevJobCountRef.current !== null && jobs.jobs.length > 0) {
    // 取最新的 3 个岗位作为"新发布"通知示例
    const recentJobs = [...jobs.jobs]
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
      .slice(0, 3);

    recentJobs.forEach((job, idx) => {
      if (idx < 2) { // 最多展示2个新岗位通知
        notifs.push({
          id: `new-job-${job.id}`,
          type: 'new_job',
          title: `${job.company} - ${job.title}`,
          description: `${job.location || ''}${job.location ? ' · ' : ''}${job.salary || '薪资面议'}`,
          timestamp: job.publishedAt || fmt(new Date(Date.now() - idx * 3600000)),
          isRead: false,
          jobId: job.id,
        });
      }
    });
  }

  // 3) 推荐引导通知（固定提示）
  notifs.push({
    id: 'recommend-tip',
    type: 'recommendation',
    title: '每周推荐',
    description: `根据你的专业方向，本周推荐优先关注：${jobs.jobs.slice(0, 3).map(j => j.company).join('、')}等企业的岗位`,
    timestamp: fmt(new Date(Date.now() - 86400000)),
    isRead: true,
  });

  return notifs;
}

export default function NotificationsScreen() {
  const jobs = useJobs();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 用于跨渲染周期记录上次见到的岗位数（检测新增）
  const prevJobCountRef = React.useRef<number | null>(null);

  // 首次加载或数据变化时构建通知列表
  useEffect(() => {
    if (!jobs.loading) {
      const notifs = buildNotificationsFromJobs(jobs, prevJobCountRef);
      setNotifications(notifs);
    }
  }, [jobs.loading, jobs.jobs.length, jobs.lastUpdate, jobs.dataSource]);

  // 下拉刷新 → 触发 JobsContext 刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await jobs.refresh();
    // refresh 后 useEffect 会自动重建通知
    setTimeout(() => setRefreshing(false), 1000);
  };

  // 标记已读
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  // 点击通知
  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.jobId) {
      console.log('Navigate to job detail:', notification.jobId);
    }
  };

  // 清空所有通知
  const handleClearAll = () => {
    setNotifications([]);
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return '⏰';
      case 'new_job': return '🎉';
      case 'recommendation': return '📊';
      case 'update': return '📝';
      default: return '🔔';
    }
  };

  // 获取通知图标背景色
  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'deadline':   return '#ffebee';
      case 'new_job':   return '#e8f5e9';
      case 'recommendation': return '#e3f2fd';
      case 'update':    return '#fff3e0';
      default:          return '#f5f5f5';
    }
  };

  // 按日期分组
  const groups = useMemo(() => {
    const result: { title: string; data: Notification[] }[] = [];
    let currentDate = '';
    let currentGroup: Notification[] = [];

    notifications.forEach(notif => {
      const date = notif.timestamp.split(' ')[0];
      if (date !== currentDate) {
        if (currentGroup.length > 0) result.push({ title: currentDate, data: currentGroup });
        currentDate = date;
        currentGroup = [notif];
      } else {
        currentGroup.push(notif);
      }
    });
    if (currentGroup.length > 0) result.push({ title: currentDate, data: currentGroup });
    return result;
  }, [notifications]);

  // 未读数
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {notifications.length > 0 ? (
        <>
          {/* 头部 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>通知中心</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearBtn}>清空</Text>
            </TouchableOpacity>
          </View>

          {/* 数据状态卡片 */}
          {!jobs.loading && (
            <View style={styles.dataCard}>
              <Text style={styles.dataCardLabel}>数据概览</Text>
              <View style={styles.dataCardRow}>
                <View style={styles.dataStat}>
                  <Text style={styles.dataStatNum}>{jobs.jobs.length}</Text>
                  <Text style={styles.dataStatLabel}>岗位数</Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataStat}>
                  <Text style={[styles.dataStatSource, { color: jobs.dataSource === 'remote' ? '#27ae60' : '#e67e22' }]}>
                    {jobs.dataSource === 'remote' ? '远程' : '本地'}
                  </Text>
                  <Text style={styles.dataStatLabel}>来源</Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataStat}>
                  <Text style={styles.dataStatTime} numberOfLines={1}>{jobs.lastUpdate}</Text>
                  <Text style={styles.dataStatLabel}>更新时间</Text>
                </View>
              </View>
            </View>
          )}

          {/* 通知列表 */}
          <FlatList
            data={groups}
            renderItem={({ item: group }) => (
              <View>
                <Text style={styles.dateHeader}>{group.title}</Text>
                {group.data.map(notification => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[styles.notificationItem, !notification.isRead && styles.notificationUnread]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: getNotificationIconBg(notification.type) }]}>
                      <Text style={styles.notificationIconText}>{getNotificationIcon(notification.type)}</Text>
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, !notification.isRead && styles.notificationTitleUnread]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationDesc} numberOfLines={2}>
                        {notification.description}
                      </Text>
                      <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                    </View>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            keyExtractor={item => item.title}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
            }
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>暂无通知</Text>
          <Text style={styles.emptyDesc}>
            {jobs.loading ? '正在加载数据...' : '下拉刷新获取最新岗位信息'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  unreadBadge: {
    backgroundColor: '#ff4757',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
  // 数据概览卡片
  dataCard: {
    margin: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dataCardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  dataCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataStat: {
    flex: 1,
    alignItems: 'center',
  },
  dataStatNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a73e8',
  },
  dataStatSource: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27ae60', // 远程默认绿色，渲染时按 dataSource 动态覆盖
  },
  dataStatTime: {
    fontSize: 13,
    color: '#666',
  },
  dataStatLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  dataDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#eee',
  },
  listContent: {
    padding: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationUnread: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#1a73e8',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
