<template>
  <view class="doctor-nav">
    <view class="nav-content">
      <view
        class="nav-item"
        :class="{ active: current === 'patients' }"
        @click="goTo('patients')"
      >
        <text class="nav-icon">👥</text>
        <text class="nav-text">患者管理</text>
      </view>
      <view
        class="nav-item"
        :class="{ active: current === 'review' }"
        @click="goTo('review')"
      >
        <text class="nav-icon">📋</text>
        <text class="nav-text">待审核</text>
        <view v-if="pendingCount > 0" class="badge">{{ pendingCount > 99 ? '99+' : pendingCount }}</view>
      </view>
      <view
        class="nav-item"
        :class="{ active: current === 'profile' }"
        @click="goTo('profile')"
      >
        <text class="nav-icon">👤</text>
        <text class="nav-text">个人中心</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { doctorAPI } from '@/api/doctor';

const props = defineProps({
  current: {
    type: String,
    default: 'patients', // 可选值: patients, review, profile
  },
});

const pendingCount = ref(0);

// 加载待审核数量
const loadPendingCount = async () => {
  try {
    const result = await doctorAPI.getMyPatients();
    const patients = result.items || result || [];
    // 确保 patients 是数组
    if (Array.isArray(patients)) {
      pendingCount.value = patients.filter((p: any) => p.pendingReview === true).length;
    }
  } catch (error) {
    console.error('获取待审核数量失败:', error);
  }
};

// 导航到指定页面
const goTo = (page: string) => {
  if (page === props.current) return;

  const routes: Record<string, string> = {
    patients: '/pages/doctor/index',
    review: '/pages/doctor/pending-review',
    profile: '/pages/profile/index',
  };

  uni.reLaunch({ url: routes[page] });
};

onMounted(() => {
  loadPendingCount();
});
</script>

<style scoped>
.doctor-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.nav-content {
  display: flex;
  padding: 0 20rpx;
  padding-top: var(--status-bar-height, 44px);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 10rpx;
  position: relative;
  border-bottom: 4rpx solid transparent;
  transition: all 0.3s ease;
}

.nav-item.active {
  border-bottom-color: #667eea;
}

.nav-item.active .nav-text {
  color: #667eea;
  font-weight: bold;
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 36rpx;
  margin-bottom: 6rpx;
  transition: transform 0.3s ease;
}

.nav-text {
  font-size: 24rpx;
  color: #666666;
  transition: color 0.3s ease;
}

.badge {
  position: absolute;
  top: 10rpx;
  right: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  background-color: #ff4d4f;
  color: #ffffff;
  font-size: 20rpx;
  border-radius: 16rpx;
  text-align: center;
}
</style>
