<template>
  <view class="pending-review-container">
    <!-- 顶部统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ pendingCount }}</text>
        <text class="stat-label">待审核</text>
      </view>
    </view>

    <!-- 待审核列表 -->
    <view class="review-list">
      <view
        v-for="patient in pendingPatients"
        :key="patient.id"
        class="review-card"
        @click="goToReview(patient)"
      >
        <view class="card-header">
          <view class="patient-avatar">
            <text>{{ patient.name?.charAt(0) }}</text>
          </view>
          <view class="patient-info">
            <view class="name-row">
              <text class="patient-name">{{ patient.name }}</text>
              <view class="stage-badge">{{ getStageDisplayName(patient.currentStage) }}</view>
            </view>
            <text class="patient-code">编号: {{ patient.patientCode }}</text>
            <text class="patient-meta">{{ patient.gender === 'male' ? '男' : '女' }} | 入组: {{ patient.enrollmentDate }}</text>
          </view>
        </view>

        <view class="card-status">
          <view class="status-badge">
            <text class="status-icon">⏳</text>
            <text>{{ getStageDisplayName(patient.currentStage) }} 阶段待审核</text>
          </view>
        </view>

        <view class="card-footer">
          <text class="footer-text">点击查看详情并审核</text>
          <text class="footer-arrow">›</text>
        </view>
      </view>

      <view v-if="pendingPatients.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">✅</text>
        <text class="empty-text">暂无待审核患者</text>
        <text class="empty-hint">所有患者均已审核完成</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>

    <!-- 底部 tabbar -->
    <DoctorTabbar current="home" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { doctorAPI } from '../../api/doctor';
import { getStageDisplayName } from '../../utils/stage';
import DoctorTabbar from '../../components/doctor-tabbar/index.vue';

const loading = ref(false);
const patients = ref<any[]>([]);

// 待审核患者列表
const pendingPatients = computed(() => {
  if (!Array.isArray(patients.value)) return [];
  return patients.value.filter(p => p.pendingReview === true);
});

// 待审核数量
const pendingCount = computed(() => {
  return pendingPatients.value.length;
});

// 加载患者列表
const loadPatients = async () => {
  try {
    loading.value = true;

    const result = await doctorAPI.getMyPatients();
    const list = result.items || result || [];
    patients.value = Array.isArray(list) ? list : [];
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 进入患者详情（直接在详情页审核）
const goToReview = (patient: any) => {
  uni.navigateTo({
    url: `/pages/doctor/patient-detail?id=${patient.id}`,
  });
};

onMounted(() => {
  loadPatients();
});

// 监听页面显示(从审核页面返回时刷新)
onShow(() => {
  loadPatients();
});
</script>

<style scoped>
.pending-review-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  display: flex;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.stat-value {
  font-size: 64rpx;
  font-weight: bold;
  color: #ffffff;
}

.stat-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 审核列表 */
.review-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.review-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  border-left: 6rpx solid #fa8c16;
}

.card-header {
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

.name-row {
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
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.patient-code {
  font-size: 24rpx;
  color: #999999;
}

.patient-meta {
  font-size: 24rpx;
  color: #666666;
}

.card-status {
  margin-bottom: 15rpx;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  background-color: #fff7e6;
  color: #fa8c16;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.status-icon {
  font-size: 28rpx;
}

.card-footer {
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

.empty-hint {
  font-size: 24rpx;
  color: #cccccc;
}

.loading-state {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999999;
}
</style>
