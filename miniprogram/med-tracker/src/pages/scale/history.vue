<template>
  <view class="history-container">
    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-item">
        <text class="filter-label">量表类型:</text>
        <picker
          mode="selector"
          :range="scaleOptions"
          range-key="label"
          :value="selectedScaleIndex"
          @change="onScaleChange"
        >
          <view class="picker">
            {{ scaleOptions[selectedScaleIndex].label }}
          </view>
        </picker>
      </view>
      <view class="filter-item">
        <text class="filter-label">阶段:</text>
        <picker
          mode="selector"
          :range="stageOptions"
          range-key="label"
          :value="selectedStageIndex"
          @change="onStageChange"
        >
          <view class="picker">
            {{ stageOptions[selectedStageIndex].label }}
          </view>
        </picker>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="record-list">
      <view
        v-for="record in records"
        :key="record.id"
        class="record-item"
        @click="viewDetail(record)"
      >
        <view class="record-header">
          <view class="scale-info">
            <text class="record-scale-name">{{ record.scale?.name || record.scale?.code }}</text>
            <text class="record-scale-code">{{ record.scale?.code }}</text>
          </view>
          <text class="record-stage">{{ record.stage }}</text>
        </view>
        <view class="record-info">
          <text class="record-score">得分: {{ record.totalScore }}</text>
          <text class="record-time">{{ formatTime(record.createdAt) }}</text>
        </view>
        <view v-if="record.scale?.type === 'doctor'" class="record-badge">
          <text class="badge-text">医生代填</text>
        </view>
      </view>

      <view v-if="records.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无历史记录</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { scaleAPI } from '../../api/scale';
import { patientAPI } from '../../api/patient';

const loading = ref(false);
const records = ref<any[]>([]);
const patientInfo = ref<any>({});

// 量表选项
const scaleOptions = ref([
  { label: '全部', value: '' },
  { label: 'AIS', value: 'AIS' },
  { label: 'ESS', value: 'ESS' },
  { label: 'GAD7', value: 'GAD7' },
  { label: 'PHQ9', value: 'PHQ9' },
  { label: 'HAMA', value: 'HAMA' },
  { label: 'HAMD', value: 'HAMD' },
]);
const selectedScaleIndex = ref(0);

// 阶段选项
const stageOptions = ref([
  { label: '全部', value: '' },
  { label: 'V1', value: 'V1' },
  { label: 'V2', value: 'V2' },
  { label: 'V3', value: 'V3' },
  { label: 'V4', value: 'V4' },
]);
const selectedStageIndex = ref(0);

// 加载历史记录
const loadRecords = async () => {
  try {
    loading.value = true;

    // 获取患者信息
    if (!patientInfo.value.id) {
      const patient = await patientAPI.getMyInfo();
      patientInfo.value = patient;
    }

    // 构建查询参数
    const params: any = {
      patientId: patientInfo.value.id,
    };

    const selectedScale = scaleOptions.value[selectedScaleIndex.value];
    if (selectedScale.value) {
      params.scaleCode = selectedScale.value;
    }

    const selectedStage = stageOptions.value[selectedStageIndex.value];
    if (selectedStage.value) {
      params.stage = selectedStage.value;
    }

    // 获取记录
    const result = await scaleAPI.getRecords(params);
    records.value = result.list || result.items || result || [];
  } catch (error: any) {
    console.error('加载历史记录失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 量表类型变化
const onScaleChange = (e: any) => {
  selectedScaleIndex.value = e.detail.value;
  loadRecords();
};

// 阶段变化
const onStageChange = (e: any) => {
  selectedStageIndex.value = e.detail.value;
  loadRecords();
};

// 查看详情
const viewDetail = (record: any) => {
  if (record.id) {
    uni.navigateTo({
      url: `/pages/scale/detail?id=${record.id}`,
    });
  } else {
    uni.showToast({
      title: '无法查看详情',
      icon: 'none',
    });
  }
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '';
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 筛选条件 */
.filter-section {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.picker {
  font-size: 28rpx;
  color: #667eea;
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  background-color: #f5f7fa;
}

/* 记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  position: relative;
  transition: all 0.3s ease;
}

.record-item:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.scale-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.record-scale-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.record-scale-code {
  font-size: 24rpx;
  color: #999999;
}

.record-stage {
  font-size: 24rpx;
  color: #667eea;
  background-color: #f0f2ff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  white-space: nowrap;
}

.record-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-score {
  font-size: 28rpx;
  color: #52c41a;
  font-weight: 500;
}

.record-time {
  font-size: 24rpx;
  color: #999999;
}

.record-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #ff9800;
  background-color: #fff7e6;
  padding: 6rpx 12rpx;
  border-radius: 10rpx;
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
  font-size: 100rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

/* 加载状态 */
.loading-state {
  padding: 60rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}
</style>
