import { Redirect } from 'expo-router';

// 根路由 "/" 自动跳转到欢迎页
export default function Index() {
  return <Redirect href="/welcome" />;
}
