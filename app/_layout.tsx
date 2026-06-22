// 根布局 - 配置Expo Router
import { Stack } from 'expo-router';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { JobsProvider } from '../contexts/JobsContext';

export default function RootLayout() {
  return (
    <JobsProvider>
      <FavoritesProvider>
        <Stack
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="job/[id]" />
        </Stack>
      </FavoritesProvider>
    </JobsProvider>
  );
}
