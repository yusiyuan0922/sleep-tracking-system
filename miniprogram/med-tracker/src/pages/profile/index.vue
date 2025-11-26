<template>
  <view class="profile-container">
    <!-- 患者信息卡片 -->
    <view class="profile-header">
      <view class="avatar-section">
        <text class="avatar-icon">👤</text>
      </view>
      <view class="info-section">
        <text class="patient-name">{{ patientInfo.name }}</text>
        <text class="patient-code">编号: {{ patientInfo.patientCode }}</text>
      </view>
      <view class="stage-badge" :class="'stage-' + patientInfo.currentStage?.toLowerCase()">
        {{ patientInfo.currentStage }}
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view class="card-title">
        <text>基本信息</text>
      </view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">性别</text>
          <text class="info-value">{{ patientInfo.gender === 'male' ? '男' : '女' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">出生日期</text>
          <text class="info-value">{{ patientInfo.birthDate }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">联系电话</text>
          <text class="info-value">{{ patientInfo.phone }}</text>
        </view>
        <view v-if="patientInfo.emergencyContact" class="info-item">
          <text class="info-label">紧急联系人</text>
          <text class="info-value">{{ patientInfo.emergencyContact }} ({{ patientInfo.emergencyPhone }})</text>
        </view>
        <view class="info-item">
          <text class="info-label">入组日期</text>
          <text class="info-value">{{ patientInfo.enrollmentDate }}</text>
        </view>
      </view>
    </view>

    <!-- 就诊信息 -->
    <view class="info-card">
      <view class="card-title">
        <text>就诊信息</text>
      </view>
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">医院</text>
          <text class="info-value">{{ patientInfo.hospital?.name }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">主治医生</text>
          <text class="info-value">{{ patientInfo.doctor?.name }}</text>
        </view>
        <view v-if="patientInfo.diagnosis" class="info-item vertical">
          <text class="info-label">诊断信息</text>
          <text class="info-value">{{ patientInfo.diagnosis }}</text>
        </view>
      </view>
    </view>

    <!-- 阶段进度 -->
    <view class="info-card">
      <view class="card-title">
        <text>阶段进度</text>
      </view>
      <view class="stage-timeline">
        <view
          v-for="stage in stageProgress"
          :key="stage.name"
          class="stage-item"
          :class="{ completed: stage.completed, current: stage.current }"
        >
          <view class="stage-marker">
            <text v-if="stage.completed" class="marker-icon">✓</text>
            <text v-else class="marker-dot"></text>
          </view>
          <view class="stage-content">
            <text class="stage-name">{{ stage.name }}</text>
            <text v-if="stage.completedAt" class="stage-time">{{ stage.completedAt }}</text>
            <text v-else-if="stage.current" class="stage-status">进行中</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToPage('/pages/scale/list')">
        <text class="menu-icon">📊</text>
        <text class="menu-text">我的量表</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPage('/pages/medication/list')">
        <text class="menu-icon">💊</text>
        <text class="menu-text">用药记录</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPage('/pages/adverse-event/list')">
        <text class="menu-icon">⚠️</text>
        <text class="menu-text">不良事件</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToPage('/pages/medical-file/list')">
        <text class="menu-icon">📄</text>
        <text class="menu-text">病历文件</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { patientAPI } from '../../api/patient';
import { config } from '../../config';

const patientInfo = ref<any>({});

// 阶段进度
const stageProgress = computed(() => {
  const stages = ['V1', 'V2', 'V3', 'V4'];
  const currentStage = patientInfo.value.currentStage;

  return stages.map((stage) => {
    const completedAtKey = `${stage.toLowerCase()}CompletedAt`;
    const completedAt = patientInfo.value[completedAtKey];

    return {
      name: stage,
      completed: !!completedAt,
      current: stage === currentStage,
      completedAt: completedAt,
    };
  });
});

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getMyInfo();
    patientInfo.value = result;
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
};

// 跳转到页面
const goToPage = (url: string) => {
  uni.navigateTo({ url });
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

        // 跳转到登录页
        uni.reLaunch({
          url: '/pages/login/index',
        });
      }
    },
  });
};

onMounted(() => {
  loadPatientInfo();
});
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 30rpx;
}

/* 顶部信息 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 40rpx;
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
  gap: 12rpx;
}

.patient-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.patient-code {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stage-badge {
  padding: 10rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
  color: #ffffff;
}

/* 信息卡片 */
.info-card {
  background-color: #ffffff;
  margin: 30rpx 30rpx 0;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item.vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 15rpx;
}

.info-label {
  font-size: 28rpx;
  color: #999999;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
}

.info-item.vertical .info-value {
  text-align: left;
  line-height: 1.6;
}

/* 阶段时间轴 */
.stage-timeline {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.stage-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  position: relative;
}

.stage-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 24rpx;
  top: 50rpx;
  width: 2rpx;
  height: calc(100% + 30rpx);
  background-color: #e8e8e8;
}

.stage-item.completed:not(:last-child)::after {
  background-color: #52c41a;
}

.stage-marker {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.stage-item.completed .stage-marker {
  background-color: #52c41a;
}

.stage-item.current .stage-marker {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.marker-icon {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
}

.marker-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ffffff;
}

.stage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 8rpx;
}

.stage-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.stage-time {
  font-size: 24rpx;
  color: #999999;
}

.stage-status {
  font-size: 24rpx;
  color: #667eea;
}

/* 功能菜单 */
.menu-list {
  margin: 30rpx 30rpx 0;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  gap: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.menu-arrow {
  font-size: 36rpx;
  color: #d9d9d9;
}

/* 退出登录 */
.logout-section {
  margin: 30rpx 30rpx 0;
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
