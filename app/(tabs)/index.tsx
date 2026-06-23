import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, RefreshControl, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import JobCard from '../../components/JobCard';
import { getCities, filterJobs } from '../../data/realData';
import { Job } from '../../types/job';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useJobs } from '../../contexts/JobsContext';
import { exportJobsToCsv, ExportResult } from '../../utils/csvExport';

export default function HomeScreen() {
  const router = useRouter();
  const { jobs, loading, refresh } = useJobs();
  const { isFavorited, toggleFavorite } = useFavorites();

  const [filteredJobs, setFilteredJobs] = useState<Job[]>(jobs);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('全部');
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 城市标签列表（随远程数据动态更新）
  const cityTags = useMemo(() => {
    try { return ['全部', ...getCities(jobs)]; }
    catch { return ['全部']; }
  }, [jobs]);

  // 筛选逻辑（首页：关键词 + 城市快捷标签）
  const applyFilter = useCallback((keyword: string, city: string) => {
    let filtered = [...jobs];

    if (keyword.trim() !== '') {
      const kw = keyword.toLowerCase().trim();
      filtered = filtered.filter(job =>
        `${job.title} ${job.company} ${job.major} ${job.region}`.toLowerCase().includes(kw)
      );
    }

    if (city !== '全部') {
      filtered = filtered.filter(job => job.region === city);
    }

    setFilteredJobs(filtered);
  }, [jobs]);

  // 初始化 / 远程数据更新时同步
  React.useEffect(() => {
    applyFilter(searchKeyword, selectedCity);
  }, [jobs, applyFilter]);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    applyFilter(keyword, selectedCity);
  };

  const handleCityFilter = (city: string) => {
    setSelectedCity(city);
    applyFilter(searchKeyword, city);
  };

  // 点击搜索栏 → 跳转到搜索页
  const goToSearch = () => {
    router.push('/(tabs)/search');
  };

  // 点击岗位卡片 → 跳转到详情页
  const handleJobPress = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  // 点击收藏按钮
  const handleFavorite = (jobId: string) => {
    toggleFavorite(jobId);
  };

  // 下拉刷新（触发远程检查）
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    applyFilter(searchKeyword, selectedCity);
    setRefreshing(false);
  };

  // 导出全部岗位为CSV文件
  const handleExportCsv = async () => {
    if (isExporting) return; // 防止重复点击
    
    if (!jobs || jobs.length === 0) {
      Alert.alert('提示', '当前没有岗位数据可导出');
      return;
    }

    setIsExporting(true);
    try {
      const result: ExportResult = await exportJobsToCsv(jobs);
      if (result.success) {
        Alert.alert('导出成功', result.message);
      } else {
        Alert.alert('导出失败', result.message);
      }
    } catch (error: any) {
      Alert.alert('导出错误', error.message || '未知错误');
    } finally {
      setIsExporting(false);
    }
  };

  // 首次加载中
  if (loading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>正在获取最新岗位数据...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 搜索栏 + 筛选按钮 */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.searchBar} onPress={goToSearch} activeOpacity={0.85}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            {searchKeyword || '搜索岗位、单位、专业...'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={goToSearch} activeOpacity={0.7}>
          <Text style={styles.filterBtnIcon}>⚙️</Text>
          <Text style={styles.filterBtnText}>筛选</Text>
        </TouchableOpacity>
      </View>

      {/* 城市快捷标签 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={cityTags}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCity === item && styles.chipActive]}
              onPress={() => handleCityFilter(item)}
            >
              <Text style={[styles.chipText, selectedCity === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* 岗位列表 */}
      <FlatList
        data={filteredJobs}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={handleJobPress}
            onFavorite={handleFavorite}
            isFavorited={isFavorited(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCount}>共 {filteredJobs.length} 个岗位</Text>
              <TouchableOpacity 
                style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]} 
                onPress={handleExportCsv} 
                disabled={isExporting}
                activeOpacity={0.7}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.exportBtnText}>📥 导出CSV</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.resultHint}>下拉刷新 · 点「筛选」精准搜索</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无匹配的岗位</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  filterBtnIcon: {
    fontSize: 14,
  },
  filterBtnText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    padding: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1a73e8',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#999',
  },
  resultHint: {
    fontSize: 11,
    color: '#bbb',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  exportBtnDisabled: {
    backgroundColor: '#95a5a6',
  },
  exportBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
