import React from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import JobCard from '../../components/JobCard';
import { realJobs } from '../../data/realData';
import { Job } from '../../types/job';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoritedIds, removeFavorite } = useFavorites();

  // 根据收藏ID列表过滤出岗位
  const favoritedJobs: Job[] = realJobs.filter(job => favoritedIds.includes(job.id));

  // 取消收藏
  const handleUnfavorite = (jobId: string) => {
    removeFavorite(jobId);
  };

  // 点击岗位卡片 → 跳转到详情页
  const handleJobPress = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {favoritedJobs.length > 0 ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>收藏的岗位</Text>
            <Text style={styles.headerCount}>{favoritedJobs.length} 个岗位</Text>
          </View>

          <FlatList
            data={favoritedJobs}
            renderItem={({ item }) => (
              <JobCard
                job={item}
                onPress={handleJobPress}
                onFavorite={handleUnfavorite}
                isFavorited={true}
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>暂无收藏</Text>
          <Text style={styles.emptyDesc}>浏览岗位时点击🤍收藏感兴趣的岗位</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/index')}
          >
            <Text style={styles.browseBtnText}>去浏览岗位</Text>
          </TouchableOpacity>
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerCount: {
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
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
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
