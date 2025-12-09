<template>
  <view class="doctor-home">
    <!-- 顶部欢迎区域 -->
    <view class="welcome-section">
      <view class="welcome-content">
        <text class="welcome-text">欢迎，{{ doctorName }}医生</text>
        <text class="welcome-subtitle">睡眠跟踪管理系统</text>
      </view>
      <view class="date-info">
        <text class="date-text">{{ currentDate }}</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card" @click="goToPatients">
        <text class="stat-icon">👥</text>
        <text class="stat-value">{{ stats.totalPatients }}</text>
        <text class="stat-label">我的患者</text>
      </view>
      <view class="stat-card pending" @click="goToPendingReview">
        <text class="stat-icon">📋</text>
        <text class="stat-value">{{ stats.pendingReview }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-card" @click="goToPatients">
        <text class="stat-icon">🏥</text>
        <text class="stat-value">{{ stats.activePatients }}</text>
        <text class="stat-label">进行中</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-section">
      <text class="section-title">快捷操作</text>
      <view class="quick-grid">
        <view class="quick-item" @click="goToPatients">
          <view class="quick-icon blue">👥</view>
          <text class="quick-text">患者管理</text>
        </view>
        <view class="quick-item" @click="goToPendingReview">
          <view class="quick-icon orange">📋</view>
          <text class="quick-text">待审核</text>
          <view v-if="stats.pendingReview > 0" class="quick-badge">{{ stats.pendingReview }}</view>
        </view>
        <view class="quick-item" @click="goToFillScale">
          <view class="quick-icon green">📊</view>
          <text class="quick-text">填写量表</text>
        </view>
        <view class="quick-item" @click="goToMessage">
          <view class="quick-icon purple">📨</view>
          <text class="quick-text">消息中心</text>
          <view v-if="unreadCount > 0" class="quick-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</view>
        </view>
      </view>
    </view>

    <!-- 待审核患者列表 -->
    <view class="pending-section" v-if="pendingPatients.length > 0">
      <view class="section-header">
        <text class="section-title">待审核患者</text>
        <text class="section-more" @click="goToPendingReview">查看全部 ></text>
      </view>
      <view class="pending-list">
        <view
          v-for="patient in pendingPatients.slice(0, 3)"
          :key="patient.id"
          class="pending-item"
          @click="goToPatientDetail(patient.id)"
        >
          <view class="pending-avatar">
            <text>{{ patient.name?.charAt(0) }}</text>
          </view>
          <view class="pending-info">
            <text class="pending-name">{{ patient.name }}</text>
            <text class="pending-stage">{{ patient.currentStage }} 待审核</text>
          </view>
          <text class="pending-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 功能说明 -->
    <view class="info-section">
      <text class="section-title">功能说明</text>
      <view class="info-list">
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">查看和管理您的患者</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">审核患者提交的资料</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">查看患者量表记录</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">填写医生代填量表(HAMA/HAMD)</text>
        </view>
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
import { getUnreadCount } from '../../api/message';
import DoctorTabbar from '../../components/doctor-tabbar/index.vue';
import config from '@/config';

const doctorName = ref('');
const unreadCount = ref(0);
const patients = ref<any[]>([]);

const stats = ref({
  totalPatients: 0,
  pendingReview: 0,
  activePatients: 0,
});

// 当前日期
const currentDate = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[now.getDay()];
  return `${year}年${month}月${day}日 星期${weekDay}`;
});

// 待审核患者列表
const pendingPatients = computed(() => {
  return patients.value.filter(p => p.pendingReview === true);
});

// 加载医生信息
const loadDoctorInfo = () => {
  const userInfo = uni.getStorageSync(config.userInfoKey);
  if (userInfo) {
    doctorName.value = userInfo.doctor?.name || userInfo.name || '医生';
  }
};

// 加载患者列表
const loadPatients = async () => {
  try {
    const result = await doctorAPI.getMyPatients();
    patients.value = result.items || result || [];

    // 计算统计数据
    stats.value.totalPatients = patients.value.length;
    stats.value.pendingReview = patients.value.filter(p => p.pendingReview).length;
    stats.value.activePatients = patients.value.filter(p => p.currentStage !== 'completed').length;
  } catch (error) {
    console.error('加载患者列表失败:', error);
  }
};

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCount();
    unreadCount.value = res?.count || 0;
  } catch (error) {
    console.error('加载未读消息数量失败:', error);
  }
};

// 导航方法
const goToPatients = () => {
  uni.reLaunch({ url: '/pages/doctor/index' });
};

const goToPendingReview = () => {
  uni.navigateTo({ url: '/pages/doctor/pending-review' });
};

const goToFillScale = () => {
  uni.navigateTo({ url: '/pages/doctor/select-scale' });
};

const goToMessage = () => {
  uni.reLaunch({ url: '/pages/doctor/message' });
};

const goToPatientDetail = (patientId: number) => {
  uni.navigateTo({ url: `/pages/doctor/patient-detail?id=${patientId}` });
};

onMounted(() => {
  loadDoctorInfo();
  loadPatients();
  loadUnreadCount();
});

onShow(() => {
  loadPatients();
  loadUnreadCount();
});
</script>

<style scoped>
.doctor-home {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.welcome-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.welcome-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.date-info {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
}

.date-text {
  font-size: 22rpx;
  color: #ffffff;
}

/* 统计卡片 */
.stats-section {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  margin-top: -30rpx;
}

.stat-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.stat-card.pending {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}

.stat-icon {
  font-size: 40rpx;
}

.stat-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;
}

.stat-label {
  font-size: 22rpx;
  color: #666666;
}

/* 快捷操作 */
.quick-section {
  padding: 0 30rpx 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.quick-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  position: relative;
}

.quick-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.quick-icon.blue {
  background-color: #e6f7ff;
}

.quick-icon.orange {
  background-color: #fff7e6;
}

.quick-icon.green {
  background-color: #f6ffed;
}

.quick-icon.purple {
  background-color: #f9f0ff;
}

.quick-text {
  font-size: 24rpx;
  color: #333333;
}

.quick-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  min-width: 32rpx;
  height: 32rpx;
  background-color: #ff4d4f;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

/* 待审核患者列表 */
.pending-section {
  padding: 0 30rpx 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-more {
  font-size: 24rpx;
  color: #667eea;
}

.pending-list {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.pending-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  gap: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.pending-item:last-child {
  border-bottom: none;
}

.pending-avatar {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.pending-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.pending-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.pending-stage {
  font-size: 24rpx;
  color: #fa8c16;
}

.pending-arrow {
  font-size: 28rpx;
  color: #d9d9d9;
}

/* 功能说明 */
.info-section {
  padding: 0 30rpx 30rpx;
}

.info-list {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.info-item {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
}

.info-dot {
  color: #667eea;
  font-size: 28rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666666;
}
</style>
