<template>
  <view class="adverse-event-list-container">
    <!-- 添加按钮 -->
    <view class="add-section">
      <button class="add-btn" @click="goToAdd">
        <text class="add-icon">+</text>
        <text>上报不良事件</text>
      </button>
    </view>

    <!-- 不良事件列表 -->
    <view class="event-list">
      <view
        v-for="event in events"
        :key="event.id"
        class="event-item"
        @click="handleItemClick(event)"
      >
        <view class="event-header">
          <text class="event-name">{{ event.eventName }}</text>
          <view class="severity-tag" :class="'severity-' + event.severity">
            {{ severityLabels[event.severity] }}
          </view>
        </view>
        <view class="event-info">
          <text class="info-item">发生时间: {{ event.occurredAt }}</text>
        </view>
        <view class="event-info">
          <text class="info-item">持续时间: {{ event.duration }}</text>
          <text class="info-item">与研究药物关系: {{ relationshipLabels[event.relationship] }}</text>
        </view>
        <view v-if="event.medicalIntervention" class="event-info">
          <text class="info-item intervention">已采取医疗干预</text>
        </view>
        <view class="event-footer">
          <text class="outcome-text">结果: {{ outcomeLabels[event.outcome] }}</text>
          <text class="stage-text">{{ event.stage }}</text>
        </view>
      </view>

      <view v-if="events.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">⚠️</text>
        <text class="empty-text">暂无不良事件记录</text>
        <text class="empty-hint">如有不良反应请及时上报</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adverseEventAPI } from '../../api/adverse-event';
import { patientAPI } from '../../api/patient';

const events = ref<any[]>([]);
const loading = ref(false);

const severityLabels: any = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const relationshipLabels: any = {
  definitely_related: '肯定相关',
  probably_related: '可能相关',
  possibly_related: '可疑相关',
  unlikely_related: '可能无关',
  not_related: '肯定无关',
};

const outcomeLabels: any = {
  recovered: '已恢复',
  recovering: '恢复中',
  not_recovered: '未恢复',
  sequelae: '有后遗症',
  death: '死亡',
  unknown: '未知',
};

// 加载不良事件列表
const loadEvents = async () => {
  try {
    loading.value = true;

    // 获取患者信息
    const patient = await patientAPI.getMyInfo();

    // 获取不良事件列表
    const result = await adverseEventAPI.getList({
      patientId: patient.id,
    });

    events.value = result.items || result || [];
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 跳转到添加页面
const goToAdd = () => {
  uni.navigateTo({
    url: '/pages/adverse-event/add',
  });
};

// 点击事件项
const handleItemClick = (event: any) => {
  uni.navigateTo({
    url: `/pages/adverse-event/detail?id=${event.id}`,
  });
};

onMounted(() => {
  loadEvents();
});

// 监听页面显示(从添加页面返回时刷新)
onShow(() => {
  loadEvents();
});
</script>

<style scoped>
.adverse-event-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 添加按钮 */
.add-section {
  margin-bottom: 30rpx;
}

.add-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-icon {
  font-size: 36rpx;
}

/* 不良事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.event-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  border-left: 6rpx solid #ff6b6b;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.event-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
}

.severity-tag {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.severity-mild {
  background-color: #e6fffb;
  color: #13c2c2;
}

.severity-moderate {
  background-color: #fff7e6;
  color: #fa8c16;
}

.severity-severe {
  background-color: #fff1f0;
  color: #f5222d;
}

.event-info {
  display: flex;
  gap: 30rpx;
  margin-bottom: 12rpx;
  flex-wrap: wrap;
}

.info-item {
  font-size: 26rpx;
  color: #666666;
}

.info-item.intervention {
  color: #fa8c16;
  font-weight: 500;
}

.event-footer {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.outcome-text {
  font-size: 26rpx;
  color: #666666;
}

.stage-text {
  font-size: 22rpx;
  color: #999999;
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
