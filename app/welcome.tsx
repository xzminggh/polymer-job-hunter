import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const handleEnter = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      <TouchableOpacity
        style={styles.touchableArea}
        onPress={handleEnter}
        activeOpacity={0.9}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 品牌区 */}
          <View style={styles.brandSection}>
            <Text style={styles.logo}>🎯</Text>
            <Text style={styles.appName}>岗位猎手</Text>
            <Text style={styles.tagline}>长三角高分子材料 · 硕士岗位精选</Text>
          </View>

          {/* 功能介绍 */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>你能用它做什么？</Text>

            <FeatureRow icon="📋" title="浏览真实岗位" desc="60+ 企业和研究院真实招聘信息，持续更新" />
            <FeatureRow icon="🔍" title="精准筛选" desc="按城市、学历、岗位类型快速定位" />
            <FeatureRow icon="⏰" title="截止提醒" desc="即将关闭自动提醒，不再错过投递窗口" />
            <FeatureRow icon="❤️" title="收藏管理" desc="一键收藏，集中比较和追踪心仪岗位" />
          </View>

          {/* 使用提示 */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 小提示</Text>
            <Text style={styles.tipsText}>
              底部导航切换「首页 / 搜索 / 收藏 / 通知 / 设置」{'\n'}
              左右滑动城市标签可快速筛选{'\n'}
              点击卡片查看详情和投递链接
            </Text>
          </View>

          {/* 进入按钮 */}
          <TouchableOpacity
            style={styles.enterButton}
            onPress={handleEnter}
            activeOpacity={0.85}
          >
            <Text style={styles.enterButtonText}>开始找工作 →</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>v1.0.0 · 数据每3天自动更新</Text>
          <View style={{ height: 20 }} />
        </ScrollView>
      </TouchableOpacity>
    </View>
  );
}

// 功能行组件（独立出来减少嵌套）
function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
  },
  touchableArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 28,
  },
  logo: {
    fontSize: 56,
    marginBottom: 10,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  featuresSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  tipsBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  enterButton: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  enterButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a73e8',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
});
