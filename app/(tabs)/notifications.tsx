import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity } from 'react-native';
import { mockNotifications } from '../../data/mockData';
import { Notification } from '../../types/job';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // 标记已读
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifs =>
      notifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  // 点击通知
  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.jobId) {
      // 导航到岗位详情页
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
      case 'deadline':
        return '⏰';
      case 'new_job':
        return '🎉';
      case 'recommendation':
        return '📊';
      case 'update':
        return '📝';
      default:
        return '🔔';
    }
  };

  // 获取通知图标背景色
  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'deadline':
        return '#ffebee';
      case 'new_job':
        return '#e8f5e9';
      case 'recommendation':
        return '#e3f2fd';
      case 'update':
        return '#fff3e0';
      default:
        return '#f5f5f5';
    }
  };

  // 按日期分组
  const groupByDate = () => {
    const groups: { title: string; data: Notification[] }[] = [];
    let currentDate = '';
    let currentGroup: Notification[] = [];

    notifications.forEach(notif => {
      const date = notif.timestamp.split(' ')[0];
      if (date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ title: currentDate, data: currentGroup });
        }
        currentDate = date;
        currentGroup = [notif];
      } else {
        currentGroup.push(notif);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ title: currentDate, data: currentGroup });
    }

    return groups;
  };

  const groups = groupByDate();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {notifications.length > 0 ? (
        <>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>通知中心</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearBtn}>清空</Text>
            </TouchableOpacity>
          </View>

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
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>暂无通知</Text>
          <Text style={styles.emptyDesc}>开启通知提醒，及时获取最新岗位信息</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clearBtn: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationUnread: {
    backgroundColor: '#f8f9ff',
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
