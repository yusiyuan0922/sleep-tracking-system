<template>
  <view class="adverse-event-detail-container">
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else-if="event" class="detail-content">
      <!-- 基本信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <text class="event-name">{{ event.eventName }}</text>
          <view class="status-tag" :class="event.isOngoing ? 'status-ongoing' : 'status-ended'">
            {{ event.isOngoing ? '持续中' : '已结束' }}
          </view>
        </view>

        <view class="info-list">
          <view class="info-item">
            <text class="info-label">AE序号</text>
            <text class="info-value">{{ event.aeNumber }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">开始时间</text>
            <text class="info-value">{{ formatDateTime(event.onsetDate) }}</text>
          </view>
          <view v-if="!event.isOngoing && event.endDate" class="info-item">
            <text class="info-label">结束时间</text>
            <text class="info-value">{{ formatDateTime(event.endDate) }}</text>
          </view>
          <view v-if="event.stage" class="info-item">
            <text class="info-label">上报阶段</text>
            <text class="info-value">{{ event.stage }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">上报时间</text>
            <text class="info-value">{{ formatDateTime(event.createdAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 描述信息 -->
      <view v-if="event.description" class="info-card">
        <view class="card-title">事件描述</view>
        <text class="description-text">{{ event.description }}</text>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-text">未找到该不良事件记录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { adverseEventAPI } from '../../api/adverse-event';

const event = ref<any>(null);
const loading = ref(true);
const eventId = ref<number | null>(null);

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 加载不良事件详情
const loadDetail = async () => {
  if (!eventId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' });
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const result = await adverseEventAPI.getDetail(eventId.value);
    event.value = result;
  } catch (error: any) {
    console.error('加载不良事件详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取参数
onLoad((options: any) => {
  console.log('adverse-event detail onLoad:', options);
  if (options.id) {
    eventId.value = Number(options.id);
    loadDetail();
  } else {
    uni.showToast({ title: '参数错误', icon: 'none' });
    loading.value = false;
  }
});
</script>

<style scoped>
.adverse-event-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.loading-state {
  padding: 120rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999999;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.info-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.event-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.status-ongoing {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-ended {
  background-color: #f0f0f0;
  color: #999999;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 28rpx;
  color: #999999;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
}

.description-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}
</style>
