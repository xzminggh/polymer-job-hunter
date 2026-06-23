// 根布局 - 配置Expo Router
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { JobsProvider } from '../contexts/JobsContext';

// 抑制 Expo Go 环境下的无害警告（无 dev server 时触发）
LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
]);

export default function RootLayout() {
  return (
    <JobsProvider>
      <FavoritesProvider>
        <Stack
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="job/[id]" />
        </Stack>
      </FavoritesProvider>
    </JobsProvider>
  );
}
