import React from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import JobCard from '../../components/JobCard';
import { Job } from '../../types/job';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useJobs } from '../../contexts/JobsContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoritedIds, removeFavorite } = useFavorites();
  const { jobs } = useJobs();

  // 根据收藏ID列表过滤出岗位
  const favoritedJobs: Job[] = jobs.filter(job => favoritedIds.includes(job.id));

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
          {/* 结果计数 */}
          <View style={styles.resultBar}>
            <Text style={styles.resultCount}>已收藏 {favoritedJobs.length} 个岗位</Text>
          </View>

          {/* 收藏列表 */}
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
        /* 空状态 */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>还没有收藏岗位</Text>
          <Text style={styles.emptyHint}>浏览岗位时，点 ❤️ 即可收藏</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/index')}
            activeOpacity={0.7}
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
  resultBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  // 空状态
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  browseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
  },
  browseBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
