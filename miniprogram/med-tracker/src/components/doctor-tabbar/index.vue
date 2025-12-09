<template>
  <view class="doctor-tabbar">
    <view class="tabbar-content">
      <view
        class="tabbar-item"
        :class="{ active: current === 'home' }"
        @click="switchTab('home')"
      >
        <text class="tabbar-icon">{{ current === 'home' ? '🏠' : '🏡' }}</text>
        <text class="tabbar-text">首页</text>
      </view>
      <view
        class="tabbar-item"
        :class="{ active: current === 'patients' }"
        @click="switchTab('patients')"
      >
        <text class="tabbar-icon">{{ current === 'patients' ? '👥' : '👤' }}</text>
        <text class="tabbar-text">患者</text>
      </view>
      <view
        class="tabbar-item"
        :class="{ active: current === 'message' }"
        @click="switchTab('message')"
      >
        <view class="icon-wrapper">
          <text class="tabbar-icon">{{ current === 'message' ? '📬' : '📪' }}</text>
          <view v-if="unreadCount > 0" class="badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </view>
        </view>
        <text class="tabbar-text">消息</text>
      </view>
      <view
        class="tabbar-item"
        :class="{ active: current === 'profile' }"
        @click="switchTab('profile')"
      >
        <text class="tabbar-icon">{{ current === 'profile' ? '⚙️' : '⚙' }}</text>
        <text class="tabbar-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUnreadCount } from '@/api/message';

const props = defineProps({
  current: {
    type: String,
    default: 'home', // home, patients, message, profile
  },
});

const unreadCount = ref(0);

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCount();
    unreadCount.value = res?.count || 0;
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
  }
};

// 切换标签页
const switchTab = (tab: string) => {
  if (tab === props.current) return;

  const routes: Record<string, string> = {
    home: '/pages/doctor/home',
    patients: '/pages/doctor/index',
    message: '/pages/doctor/message',
    profile: '/pages/doctor/profile',
  };

  uni.reLaunch({ url: routes[tab] });
};

onMounted(() => {
  loadUnreadCount();
});

// 监听消息已读事件
uni.$on('message-read', () => {
  loadUnreadCount();
});
</script>

<style scoped>
.doctor-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-content {
  display: flex;
  height: 100rpx;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
  transition: all 0.3s ease;
}

.tabbar-item.active .tabbar-text {
  color: #667eea;
  font-weight: bold;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabbar-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.tabbar-text {
  font-size: 22rpx;
  color: #666666;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -20rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  background-color: #ff4d4f;
  color: #ffffff;
  font-size: 18rpx;
  border-radius: 16rpx;
  text-align: center;
}
</style>
