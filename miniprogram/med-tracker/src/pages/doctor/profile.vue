<template>
  <view class="doctor-profile-container">
    <!-- 顶部导航栏 -->
    <DoctorNav current="profile" />

    <!-- 医生信息卡片 -->
    <view class="profile-header">
      <view class="avatar-section">
        <text class="avatar-icon">👨‍⚕️</text>
      </view>
      <view class="info-section">
        <text class="doctor-name">{{ doctorInfo.name }}</text>
        <text class="doctor-meta">{{ doctorInfo.hospital?.name }}</text>
        <text class="doctor-meta">{{ doctorInfo.title }}</text>
      </view>
    </view>

    <!-- 统计数据 -->
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
        <text class="stat-value">{{ stats.completedToday }}</text>
        <text class="stat-label">今日完成</text>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view class="card-title">
        <text>基本信息</text>
      </view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">医院</text>
          <text class="info-value">{{ doctorInfo.hospital?.name }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">科室</text>
          <text class="info-value">{{ doctorInfo.department }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">职称</text>
          <text class="info-value">{{ doctorInfo.title }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">联系电话</text>
          <text class="info-value">{{ doctorInfo.phone }}</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { doctorAPI } from '../../api/doctor';
import { config } from '../../config';
import DoctorNav from '../../components/doctor-nav/index.vue';

const doctorInfo = ref<any>({});
const stats = ref({
  totalPatients: 0,
  pendingReview: 0,
  completedToday: 0,
});

// 加载医生信息
const loadDoctorInfo = async () => {
  try {
    const result = await doctorAPI.getMyInfo();
    doctorInfo.value = result;
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取我的患者列表
    const result = await doctorAPI.getMyPatients();
    const patientList = result.items || result || [];

    stats.value.totalPatients = patientList.length;
    stats.value.pendingReview = patientList.filter((p: any) => p.pendingReview).length;

    // 今日完成审核数
    const today = new Date().toISOString().split('T')[0];
    stats.value.completedToday = patientList.filter((p: any) => {
      const stages = ['v1', 'v2', 'v3', 'v4'];
      return stages.some(stage => {
        const completedAt = p[`${stage}CompletedAt`];
        return completedAt && completedAt.startsWith(today);
      });
    }).length;
  } catch (error: any) {
    console.error('加载统计数据失败:', error);
  }
};

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗?',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储
        uni.removeStorageSync(config.tokenKey);
        uni.removeStorageSync(config.userInfoKey);

        // 跳转到医生登录页
        uni.reLaunch({
          url: '/pages/doctor/login',
        });
      }
    },
  });
};

// 监听页面显示
onShow(() => {
  loadDoctorInfo();
  loadStats();
});
</script>

<style scoped>
.doctor-profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 30rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 100rpx);
}

/* 顶部信息 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.avatar-section {
  width: 120rpx;
  height: 120rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 64rpx;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.doctor-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.doctor-meta {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 统计卡片 */
.stats-section {
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 24rpx;
  color: #666666;
}

/* 信息卡片 */
.info-card {
  background-color: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 26rpx;
  color: #999999;
}

.info-value {
  font-size: 26rpx;
  color: #333333;
  text-align: right;
}

/* 退出登录 */
.logout-section {
  margin: 0 30rpx;
}

.logout-btn {
  width: 100%;
  height: 90rpx;
  background-color: #ffffff;
  color: #ff4d4f;
  border-radius: 45rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: 2rpx solid #ff4d4f;
}
</style>
