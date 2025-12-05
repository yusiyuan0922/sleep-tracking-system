<template>
  <view class="doctor-home-container">
    <!-- 顶部导航栏 -->
    <DoctorNav current="patients" />

    <!-- 顶部统计卡片 -->
    <view class="stats-section">
      <view class="stat-card">
        <text class="stat-value">{{ stats.totalPatients }}</text>
        <text class="stat-label">我的患者</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.pendingReview }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.activePatients }}</text>
        <text class="stat-label">进行中</text>
      </view>
    </view>

    <!-- 搜索和筛选 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索患者姓名或编号"
          placeholder-class="placeholder"
          @confirm="handleSearch"
        />
      </view>
      <view class="filter-tabs">
        <view
          v-for="stage in stageFilters"
          :key="stage.value"
          class="filter-tab"
          :class="{ active: currentStageFilter === stage.value }"
          @click="changeStageFilter(stage.value)"
        >
          <text>{{ stage.label }}</text>
        </view>
      </view>
    </view>

    <!-- 患者列表 -->
    <view class="patient-list">
      <view
        v-for="patient in filteredPatients"
        :key="patient.id"
        class="patient-card"
        @click="goToPatientDetail(patient.id)"
      >
        <view class="patient-header">
          <view class="patient-avatar">
            <text>{{ patient.name?.charAt(0) }}</text>
          </view>
          <view class="patient-info">
            <view class="patient-name-row">
              <text class="patient-name">{{ patient.name }}</text>
              <view class="stage-badge" :class="'stage-' + patient.currentStage?.toLowerCase()">
                {{ patient.currentStage }}
              </view>
            </view>
            <text class="patient-code">编号: {{ patient.patientCode }}</text>
            <text class="patient-meta">{{ patient.gender === 'male' ? '男' : '女' }} | 入组: {{ patient.enrollmentDate }}</text>
          </view>
        </view>

        <view v-if="patient.pendingReview" class="patient-status">
          <view class="status-badge pending">
            <text class="status-icon">⏳</text>
            <text>{{ patient.currentStage }} 待审核</text>
          </view>
        </view>

        <view class="patient-footer">
          <text class="footer-text">点击查看详情</text>
          <text class="footer-arrow">›</text>
        </view>
      </view>

      <view v-if="filteredPatients.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无患者</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { doctorAPI } from '../../api/doctor';
import DoctorNav from '../../components/doctor-nav/index.vue';

const loading = ref(false);
const patients = ref<any[]>([]);
const searchKeyword = ref('');
const currentStageFilter = ref('all');

const stats = ref({
  totalPatients: 0,
  pendingReview: 0,
  activePatients: 0,
});

const stageFilters = [
  { value: 'all', label: '全部' },
  { value: 'V1', label: 'V1' },
  { value: 'V2', label: 'V2' },
  { value: 'V3', label: 'V3' },
  { value: 'V4', label: 'V4' },
];

// 过滤后的患者列表
const filteredPatients = computed(() => {
  let result = patients.value;

  // 阶段筛选
  if (currentStageFilter.value !== 'all') {
    result = result.filter(p => p.currentStage === currentStageFilter.value);
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(p =>
      p.name?.toLowerCase().includes(keyword) ||
      p.patientCode?.toLowerCase().includes(keyword)
    );
  }

  return result;
});

// 加载患者列表
const loadPatients = async () => {
  try {
    loading.value = true;

    // 获取我的患者列表
    const result = await doctorAPI.getMyPatients();
    patients.value = result.items || result || [];

    // 计算统计数据
    stats.value.totalPatients = patients.value.length;
    stats.value.pendingReview = patients.value.filter(p => p.pendingReview).length;
    stats.value.activePatients = patients.value.filter(p => p.currentStage !== 'completed').length;
  } catch (error: any) {
    console.error('加载患者列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 切换阶段筛选
const changeStageFilter = (stage: string) => {
  currentStageFilter.value = stage;
};

// 搜索
const handleSearch = () => {
  // 搜索会自动通过computed触发
};

// 跳转到患者详情
const goToPatientDetail = (patientId: number) => {
  uni.navigateTo({
    url: `/pages/doctor/patient-detail?id=${patientId}`,
  });
};

onMounted(() => {
  loadPatients();
});

// 监听页面显示(从详情返回时刷新)
onShow(() => {
  loadPatients();
});
</script>

<style scoped>
.doctor-home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 30rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 100rpx);
}

/* 统计卡片 */
.stats-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  display: flex;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 搜索和筛选 */
.search-section {
  padding: 30rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 50rpx;
  padding: 0 30rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.placeholder {
  color: #999999;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-tab {
  padding: 12rpx 30rpx;
  background-color: #ffffff;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666666;
  flex-shrink: 0;
}

.filter-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 500;
}

/* 患者列表 */
.patient-list {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.patient-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.patient-header {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.patient-avatar {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.patient-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.patient-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.stage-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  background-color: #e6f7ff;
  color: #1890ff;
}

.patient-code {
  font-size: 24rpx;
  color: #999999;
}

.patient-meta {
  font-size: 24rpx;
  color: #666666;
}

.patient-status {
  margin-bottom: 15rpx;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.status-badge.pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-icon {
  font-size: 28rpx;
}

.patient-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f0f0;
}

.footer-text {
  font-size: 24rpx;
  color: #999999;
}

.footer-arrow {
  font-size: 36rpx;
  color: #d9d9d9;
}

/* 空状态 */
.empty-state {
  padding: 120rpx 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.loading-state {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999999;
}
</style>
