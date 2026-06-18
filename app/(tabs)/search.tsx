import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, ScrollView,
  TouchableOpacity, TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { realJobs, filterJobs, getCities, getJobTypes, SearchCriteria } from '../../data/realData';
import JobCard from '../../components/JobCard';
import { Job } from '../../types/job';
import { useFavorites } from '../../contexts/FavoritesContext';

const EDUCATION_OPTIONS = ['不限', '硕士', '博士'];
const CATEGORY_OPTIONS = ['全部', '企业', '研究院', '高校'];
const DATE_OPTIONS = ['全部', '近3天', '近7天', '近30天'];

export default function SearchScreen() {
  const router = useRouter();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');         // 单选，空 = 全部
  const [education, setEducation] = useState('不限');
  const [jobType, setJobType] = useState('');    // 单选，空 = 全部
  const [category, setCategory] = useState('全部');
  const [publishDate, setPublishDate] = useState('全部');
  const [filterExpanded, setFilterExpanded] = useState(true);

  const cities = useMemo(() => getCities(), []);
  const jobTypes = useMemo(() => getJobTypes(), []);

  // 实时筛选 —— 改任何条件，结果立即更新
  const filteredJobs = useMemo(() => {
    return filterJobs(realJobs, {
      keyword,
      city,
      education,
      jobType,
      category,
      publishDateRange: publishDate,
    });
  }, [keyword, city, education, jobType, category, publishDate]);

  // 当前已激活的筛选条件数量
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (city !== '') count++;
    if (education !== '不限') count++;
    if (jobType !== '') count++;
    if (category !== '全部') count++;
    if (publishDate !== '全部') count++;
    return count;
  }, [city, education, jobType, category, publishDate]);

  const handleReset = useCallback(() => {
    setKeyword('');
    setCity('');
    setEducation('不限');
    setJobType('');
    setCategory('全部');
    setPublishDate('全部');
  }, []);

  // 点击岗位卡片 → 跳转到详情页
  const handleJobPress = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  // 点击收藏按钮
  const handleFavorite = (jobId: string) => {
    toggleFavorite(jobId);
  };

  const toggleFilters = () => {
    setFilterExpanded(!filterExpanded);
  };

  // 单选 Chip 组件
  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索岗位、单位、专业..."
          value={keyword}
          onChangeText={setKeyword}
          placeholderTextColor="#999"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {keyword !== '' && (
          <TouchableOpacity onPress={() => setKeyword('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 筛选切换栏 */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterToggle} onPress={toggleFilters} activeOpacity={0.7}>
          <Text style={styles.filterToggleIcon}>⚙️</Text>
          <Text style={styles.filterToggleText}>筛选条件</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
          <Text style={styles.filterArrow}>{filterExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.resetText}>重置</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 筛选条件面板（可折叠） */}
      {filterExpanded && (
        <ScrollView style={styles.filterPanel} showsVerticalScrollIndicator={false}>
          {/* 地点（单选） */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>📍 地点</Text>
            <View style={styles.chipRow}>
              <Chip label="全部" selected={city === ''} onPress={() => setCity('')} />
              {cities.map(c => (
                <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
              ))}
            </View>
          </View>

          {/* 学历（单选） */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>🎓 学历</Text>
            <View style={styles.chipRow}>
              {EDUCATION_OPTIONS.map(e => (
                <Chip key={e} label={e} selected={education === e} onPress={() => setEducation(e)} />
              ))}
            </View>
          </View>

          {/* 岗位类型（单选） */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>💼 岗位类型</Text>
            <View style={styles.chipRow}>
              <Chip label="全部" selected={jobType === ''} onPress={() => setJobType('')} />
              {jobTypes.map(t => (
                <Chip key={t} label={t} selected={jobType === t} onPress={() => setJobType(t)} />
              ))}
            </View>
          </View>

          {/* 单位类型（单选） */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>🏢 单位类型</Text>
            <View style={styles.chipRow}>
              {CATEGORY_OPTIONS.map(c => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </View>

          {/* 发布时间（单选） */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>🕐 发布时间</Text>
            <View style={styles.chipRow}>
              {DATE_OPTIONS.map(d => (
                <Chip key={d} label={d} selected={publishDate === d} onPress={() => setPublishDate(d)} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 结果计数栏 */}
      <View style={styles.resultBar}>
        <Text style={styles.resultCount}>
          共 <Text style={styles.resultCountNum}>{filteredJobs.length}</Text> 个岗位
        </Text>
      </View>

      {/* 实时结果列表 */}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>没有匹配的岗位</Text>
            <Text style={styles.emptyHint}>试试调整筛选条件</Text>
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
  // 搜索栏
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    marginBottom: 0,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  // 筛选切换栏
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterToggleIcon: {
    fontSize: 14,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterBadge: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  filterArrow: {
    fontSize: 10,
    color: '#999',
    marginLeft: 2,
  },
  resetText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '500',
  },
  // 筛选面板
  filterPanel: {
    maxHeight: 280,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextSelected: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  // 结果栏
  resultBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
  },
  resultCountNum: {
    color: '#1a73e8',
    fontWeight: '700',
    fontSize: 15,
  },
  // 列表
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  // 空状态
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: '#bbb',
  },
});
