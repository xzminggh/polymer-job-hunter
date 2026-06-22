import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Switch, TouchableOpacity, Alert, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useJobs } from '../../contexts/JobsContext';
import {
  getUpdateFrequency, scheduleUpdateReminder, cancelUpdateReminder,
  isNotificationEnabled, sendTestNotification, requestNotificationPermission,
} from '../../services/notificationService';

export default function SettingsScreen() {
  const router = useRouter();
  const { jobs, loading, lastUpdate, dataSource, refresh } = useJobs();

  const [enableNewJobPush, setEnableNewJobPush] = useState(true);
  const [enableDeadlineReminder, setEnableDeadlineReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);
  const [updateFrequency, setUpdateFrequency] = useState(3);
  const [checking, setChecking] = useState(false);

  // 启动时从持久化存储读取设置
  useEffect(() => {
    (async () => {
      const freq = await getUpdateFrequency();
      const enabled = await isNotificationEnabled();
      setUpdateFrequency(freq);
      setEnableNewJobPush(enabled);
    })();
  }, []);

  // 通知开关切换 → 调度/取消定时通知
  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('提示', '需要在系统设置中允许通知权限');
        return;
      }
      await scheduleUpdateReminder(updateFrequency);
      setEnableNewJobPush(true);
    } else {
      await cancelUpdateReminder();
      setEnableNewJobPush(false);
    }
  };

  // 更新频率切换 → 重新调度定时通知
  const handleFrequencyChange = async (days: number) => {
    setUpdateFrequency(days);
    if (enableNewJobPush) {
      await scheduleUpdateReminder(days);
    }
  };

  // 手动检查更新
  const handleManualUpdate = async () => {
    setChecking(true);
    try {
      await refresh();
      Alert.alert('更新完成', `已获取最新岗位数据，当前共 ${jobs.length} 个岗位\n数据来源：${dataSource === 'remote' ? '远程更新' : '本地内置'}`);
    } catch (e: any) {
      Alert.alert('更新失败', e.message || '请检查网络连接后重试');
    } finally {
      setChecking(false);
    }
  };

  // 发送测试通知
  const handleTestNotify = async () => {
    await sendTestNotification();
    Alert.alert('测试通知', '通知已发送，请查看通知栏');
  };

  // 开关设置项
  const SwitchItem = ({ label, value, onToggle, description }: {
    label: string; value: boolean; onToggle: () => void; description?: string;
  }) => (
    <View style={styles.settingItem}>
      <View>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e0e0e0', true: '#1a73e8' }}
        thumbColor="white"
      />
    </View>
  );

  // 可点击设置项
  const LinkItem = ({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={[styles.settingValue, !onPress && styles.settingValueStatic]}>
        {value}{onPress ? ' ›' : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 通知设置 */}
        <Text style={styles.groupTitle}>通知设置</Text>
        <View style={styles.group}>
          <SwitchItem
            label="新岗位推送"
            description={`每${updateFrequency}天上午9点提醒检查更新`}
            value={enableNewJobPush}
            onToggle={() => handlePushToggle(!enableNewJobPush)}
          />
          <SwitchItem
            label="截止日期提醒"
            value={enableDeadlineReminder}
            onToggle={() => setEnableDeadlineReminder(!enableDeadlineReminder)}
          />
          <LinkItem
            label="提醒提前天数"
            value={`${reminderDays}天`}
            onPress={() => Alert.alert('提醒提前天数', '选择提醒提前天数', [
              { text: '1天', onPress: () => setReminderDays(1) },
              { text: '3天', onPress: () => setReminderDays(3) },
              { text: '7天', onPress: () => setReminderDays(7) },
            ])}
          />
          {enableNewJobPush && (
            <TouchableOpacity style={styles.testNotifyBtn} onPress={handleTestNotify} activeOpacity={0.7}>
              <Text style={styles.testNotifyText}>发送测试通知</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 数据更新 */}
        <Text style={styles.groupTitle}>数据更新</Text>
        <View style={styles.group}>
          <LinkItem
            label="更新频率"
            value={`每${updateFrequency}天`}
            onPress={() => Alert.alert('更新频率', '选择数据更新频率', [
              { text: '每1天', onPress: () => handleFrequencyChange(1) },
              { text: '每3天（推荐）', onPress: () => handleFrequencyChange(3) },
              { text: '每7天', onPress: () => handleFrequencyChange(7) },
            ])}
          />
          <LinkItem label="上次更新" value={lastUpdate || '未知'} />
          <LinkItem label="岗位总数" value={`${jobs.length} 个`} />
          <LinkItem label="数据来源" value={dataSource === 'remote' ? '远程更新' : '本地内置'} />
          {/* 手动检查更新按钮 */}
          <TouchableOpacity
            style={[styles.updateBtn, checking && styles.updateBtnDisabled]}
            onPress={handleManualUpdate}
            disabled={checking || loading}
            activeOpacity={0.7}
          >
            {checking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.updateBtnText}>检查更新</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 关于 */}
        <Text style={styles.groupTitle}>关于</Text>
        <View style={styles.group}>
          <LinkItem label="版本" value="v1.0.0" />
          <LinkItem label="数据来源" value="21家企业 + 15家研究院" />
          <LinkItem
            label="下次自动更新"
            value={enableNewJobPush ? `每${updateFrequency}天上午9点` : '已关闭'}
          />
          <LinkItem label="数据托管" value="Gitee（国内）+ GitHub（国际）" />
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>岗位猎手</Text>
          <Text style={styles.footerDesc}>专注长三角地区高分子材料相关岗位，帮你找到好工作</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#1a73e8',
  },
  settingValueStatic: {
    color: '#999',
  },
  testNotifyBtn: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  testNotifyText: {
    fontSize: 13,
    color: '#1a73e8',
  },
  updateBtn: {
    margin: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerDesc: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
  },
});
