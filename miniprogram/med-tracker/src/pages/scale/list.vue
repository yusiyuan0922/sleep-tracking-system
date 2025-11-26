<template>
  <view class="scale-list-container">
    <!-- 阶段信息 -->
    <view class="stage-info">
      <text class="stage-title">当前阶段: {{ currentStage }}</text>
      <text class="stage-desc">请完成以下量表填写</text>
    </view>

    <!-- 量表列表 -->
    <view class="scale-list">
      <view
        v-for="scale in scales"
        :key="scale.code"
        class="scale-item"
        :class="{ completed: scale.completed }"
        @click="handleScaleClick(scale)"
      >
        <view class="scale-icon">
          <text v-if="scale.completed" class="icon-check">✓</text>
          <text v-else class="icon-empty">📋</text>
        </view>
        <view class="scale-content">
          <text class="scale-name">{{ scale.name }}</text>
          <text class="scale-desc">{{ scale.description }}</text>
          <view class="scale-meta">
            <text class="scale-questions">{{ scale.questionCount }}题</text>
            <text class="scale-time">约{{ scale.estimatedTime }}分钟</text>
          </view>
        </view>
        <view class="scale-status">
          <text v-if="scale.completed" class="status-completed">已完成</text>
          <text v-else class="status-pending">待填写</text>
        </view>
      </view>

      <view v-if="scales.length === 0" class="empty-state">
        <text class="empty-text">暂无量表</text>
      </view>
    </view>

    <!-- 历史记录入口 -->
    <view class="history-section">
      <button class="history-btn" @click="goToHistory">查看历史记录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { scaleAPI } from '../../api/scale';
import { patientAPI } from '../../api/patient';

const currentStage = ref('V1');
const scales = ref<any[]>([]);
const patientInfo = ref<any>({});

// 量表元数据
const scaleMetadata: any = {
  AIS: { name: '雅典失眠量表', description: '评估失眠严重程度', questionCount: 8, estimatedTime: 5 },
  ESS: { name: 'Epworth嗜睡量表', description: '评估日间嗜睡程度', questionCount: 8, estimatedTime: 3 },
  'GAD-7': { name: '广泛性焦虑量表', description: '评估焦虑症状', questionCount: 7, estimatedTime: 3 },
  'PHQ-9': { name: '患者健康问卷', description: '评估抑郁症状', questionCount: 9, estimatedTime: 5 },
  HAMA: { name: '汉密尔顿焦虑量表', description: '医生代填', questionCount: 14, estimatedTime: 10 },
  HAMD: { name: '汉密尔顿抑郁量表', description: '医生代填', questionCount: 24, estimatedTime: 15 },
};

// 加载患者信息和阶段状态
const loadData = async () => {
  try {
    // 获取患者信息
    const patient = await patientAPI.getMyInfo();
    patientInfo.value = patient;
    currentStage.value = patient.currentStage || 'V1';

    // 获取阶段完成状态
    const completion = await patientAPI.getStageCompletionStatus(patient.id);

    // 构建量表列表
    const requiredScales = completion.requirements?.requiredScales || [];
    scales.value = requiredScales.map((code: string) => {
      const completed = completion.completedRequirements?.some(
        (r: any) => r.type === 'scale' && r.code === code
      );
      return {
        code,
        ...scaleMetadata[code],
        completed,
      };
    });
  } catch (error: any) {
    uni.showToast({
      title: '加载数据失败',
      icon: 'none',
    });
  }
};

// 点击量表
const handleScaleClick = (scale: any) => {
  if (scale.code === 'HAMA' || scale.code === 'HAMD') {
    uni.showToast({
      title: '该量表由医生代填',
      icon: 'none',
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/scale/fill?code=${scale.code}&stage=${currentStage.value}`,
  });
};

// 查看历史记录
const goToHistory = () => {
  uni.navigateTo({
    url: '/pages/scale/history',
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.scale-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 阶段信息 */
.stage-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  color: #ffffff;
  text-align: center;
}

.stage-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.stage-desc {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
}

/* 量表列表 */
.scale-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.scale-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.scale-item.completed {
  opacity: 0.7;
}

.scale-icon {
  font-size: 48rpx;
  min-width: 60rpx;
  text-align: center;
}

.icon-check {
  color: #52c41a;
}

.scale-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.scale-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.scale-desc {
  font-size: 24rpx;
  color: #999999;
}

.scale-meta {
  display: flex;
  gap: 20rpx;
  margin-top: 5rpx;
}

.scale-questions,
.scale-time {
  font-size: 22rpx;
  color: #999999;
}

.scale-status {
  min-width: 100rpx;
  text-align: right;
}

.status-completed {
  color: #52c41a;
  font-size: 24rpx;
}

.status-pending {
  color: #ff9800;
  font-size: 24rpx;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

/* 历史记录 */
.history-section {
  margin-top: 40rpx;
}

.history-btn {
  width: 100%;
  height: 90rpx;
  background-color: #ffffff;
  color: #667eea;
  border: 2rpx solid #667eea;
  border-radius: 45rpx;
  font-size: 28rpx;
}
</style>
