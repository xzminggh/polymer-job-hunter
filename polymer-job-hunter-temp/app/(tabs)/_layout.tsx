// 底部导航布局 - 使用Expo Router的Tabs
import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router/tabs';
import { Platform } from 'react-native';

// 底部导航图标组件（使用文本图标）
const TabIcon = ({ name, color, size }: { name: string; color: any; size: number }) => {
  const iconMap: Record<string, string> = {
    'home': '🏠',
    'search': '🔍',
    'heart': '❤️',
    'notifications': '🔔',
    'settings': '⚙️',
  };

  return React.createElement(Text, {
    style: { fontSize: size, color }
  }, iconMap[name] || '•');
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      {/* 首页 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />

      {/* 搜索 */}
      <Tabs.Screen
        name="search"
        options={{
          title: '搜索',
          tabBarIcon: ({ color, size }) => <TabIcon name="search" color={color} size={size} />,
        }}
      />

      {/* 收藏 */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: '收藏',
          tabBarIcon: ({ color, size }) => <TabIcon name="heart" color={color} size={size} />,
        }}
      />

      {/* 通知 */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: '通知',
          tabBarIcon: ({ color, size }) => <TabIcon name="notifications" color={color} size={size} />,
        }}
      />

      {/* 设置 */}
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
