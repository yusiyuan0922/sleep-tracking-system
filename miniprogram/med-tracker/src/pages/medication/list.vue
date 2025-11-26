<template>
  <view class="medication-list-container">
    <!-- 添加按钮 -->
    <view class="add-section">
      <button class="add-btn" @click="goToAdd">
        <text class="add-icon">+</text>
        <text>添加用药记录</text>
      </button>
    </view>

    <!-- 用药记录列表 -->
    <view class="medication-list">
      <view
        v-for="record in records"
        :key="record.id"
        class="medication-item"
        @click="handleItemClick(record)"
      >
        <view class="medication-header">
          <text class="medication-name">{{ record.medicationName }}</text>
          <view class="stage-tag">{{ record.stage }}</view>
        </view>
        <view class="medication-info">
          <text class="info-item">剂量: {{ record.dosage }}mg</text>
          <text class="info-item">频率: {{ record.frequency }}</text>
        </view>
        <view class="medication-info">
          <text class="info-item">开始: {{ record.startDate }}</text>
          <text v-if="record.endDate" class="info-item">结束: {{ record.endDate }}</text>
          <text v-else class="info-item status-ongoing">进行中</text>
        </view>
        <view v-if="record.notes" class="medication-notes">
          <text>备注: {{ record.notes }}</text>
        </view>
      </view>

      <view v-if="records.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">💊</text>
        <text class="empty-text">暂无用药记录</text>
        <text class="empty-hint">点击上方按钮添加</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { medicationAPI } from '../../api/medication';
import { patientAPI } from '../../api/patient';

const records = ref<any[]>([]);
const loading = ref(false);
const patientInfo = ref<any>({});

// 加载用药记录
const loadRecords = async () => {
  try {
    loading.value = true;

    // 获取患者信息
    const patient = await patientAPI.getMyInfo();
    patientInfo.value = patient;

    // 获取用药记录列表
    const result = await medicationAPI.getList({
      patientId: patient.id,
    });

    records.value = result.items || result || [];
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
    url: '/pages/medication/add',
  });
};

// 点击记录项
const handleItemClick = (record: any) => {
  uni.navigateTo({
    url: `/pages/medication/detail?id=${record.id}`,
  });
};

onMounted(() => {
  loadRecords();
});

// 监听页面显示(从添加页面返回时刷新)
onShow(() => {
  loadRecords();
});
</script>

<style scoped>
.medication-list-container {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* 用药记录列表 */
.medication-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.medication-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.medication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.medication-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.stage-tag {
  padding: 6rpx 16rpx;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.medication-info {
  display: flex;
  gap: 30rpx;
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666666;
}

.status-ongoing {
  color: #52c41a;
  font-weight: 500;
}

.medication-notes {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f0f0;
}

.medication-notes text {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.5;
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
