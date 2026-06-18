// 根布局 - 配置Expo Router
import { Stack } from 'expo-router';
import { FavoritesProvider } from '../contexts/FavoritesContext';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <Stack
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" />
      </Stack>
    </FavoritesProvider>
  );
}
