<template>
  <view class="scale-detail-container">
    <!-- 头部信息 -->
    <view class="header-info">
      <view class="scale-title">
        <text class="scale-name">{{ scaleRecord.scale?.name }}</text>
        <text class="scale-code">{{ scaleRecord.scale?.code }}</text>
      </view>
      <view class="meta-info">
        <view class="meta-item">
          <text class="meta-label">阶段:</text>
          <text class="meta-value">{{ scaleRecord.stage }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">得分:</text>
          <text class="meta-value score">{{ scaleRecord.totalScore }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">填写时间:</text>
          <text class="meta-value">{{ formatTime(scaleRecord.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 题目和答案 -->
    <view class="questions-section">
      <view
        v-for="(question, index) in questions"
        :key="index"
        class="question-item"
      >
        <view class="question-header">
          <text class="question-number">第{{ index + 1 }}题</text>
        </view>
        <view class="question-text">
          <text>{{ question.question }}</text>
        </view>
        <view class="options-list">
          <view
            v-for="(option, optIndex) in question.options"
            :key="optIndex"
            class="option-item"
            :class="{ selected: isSelectedOption(index, option.value) }"
          >
            <view class="option-indicator">
              <text v-if="isSelectedOption(index, option.value)" class="check-icon">✓</text>
            </view>
            <text class="option-text">{{ option.label }}</text>
            <text v-if="isSelectedOption(index, option.value)" class="option-score">{{ option.value }}分</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 评分结果 -->
    <view v-if="scoringResult" class="scoring-result">
      <view class="result-title">
        <text>评估结果</text>
      </view>
      <view class="result-content">
        <view class="result-item">
          <text class="result-label">总分:</text>
          <text class="result-value">{{ scaleRecord.totalScore }}</text>
        </view>
        <view class="result-item">
          <text class="result-label">评级:</text>
          <text class="result-value level">{{ scoringResult.level }}</text>
        </view>
        <view class="result-item">
          <text class="result-label">说明:</text>
          <text class="result-value desc">{{ scoringResult.description }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { scaleAPI } from '../../api/scale';

const recordId = ref(0);
const scaleRecord = ref<any>({});
const questions = ref<any[]>([]);
const answers = ref<number[]>([]);

// 评分结果
const scoringResult = computed(() => {
  if (!scaleRecord.value.scale?.scoringRules || !scaleRecord.value.totalScore) {
    return null;
  }

  const rules = scaleRecord.value.scale.scoringRules;
  const score = scaleRecord.value.totalScore;

  if (rules.ranges && Array.isArray(rules.ranges)) {
    const range = rules.ranges.find((r: any) => score >= r.min && score <= r.max);
    return range || null;
  }

  return null;
});

// 检查是否是选中的选项
const isSelectedOption = (questionIndex: number, optionValue: number) => {
  return answers.value[questionIndex] === optionValue;
};

// 加载量表记录详情
const loadDetail = async () => {
  try {
    uni.showLoading({ title: '加载中...' });

    // 获取记录详情
    const record = await scaleAPI.getRecordDetail(recordId.value);
    scaleRecord.value = record;

    // 解析题目和答案
    if (record.scale?.questions) {
      questions.value = record.scale.questions;
    }

    if (record.answers && Array.isArray(record.answers)) {
      answers.value = record.answers;
    }

    uni.hideLoading();
  } catch (error: any) {
    uni.hideLoading();
    console.error('加载详情失败:', error);
    uni.showModal({
      title: '加载失败',
      content: error.message || '无法加载量表详情',
      showCancel: false,
      success: () => {
        uni.navigateBack();
      },
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

// 使用 onLoad 接收页面参数
onLoad((options: any) => {
  if (options.id) {
    recordId.value = parseInt(options.id, 10);
    loadDetail();
  } else {
    uni.showModal({
      title: '参数错误',
      content: '缺少记录ID',
      showCancel: false,
      success: () => {
        uni.navigateBack();
      },
    });
  }
});
</script>

<style scoped>
.scale-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 30rpx;
}

/* 头部信息 */
.header-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  color: #ffffff;
  margin-bottom: 30rpx;
}

.scale-title {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 30rpx;
}

.scale-name {
  font-size: 36rpx;
  font-weight: bold;
}

.scale-code {
  font-size: 24rpx;
  opacity: 0.9;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.meta-label {
  font-size: 26rpx;
  opacity: 0.9;
  min-width: 140rpx;
}

.meta-value {
  font-size: 26rpx;
  font-weight: 500;
}

.meta-value.score {
  font-size: 32rpx;
  font-weight: bold;
}

/* 题目列表 */
.questions-section {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.question-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.question-header {
  margin-bottom: 15rpx;
}

.question-number {
  display: inline-block;
  padding: 8rpx 16rpx;
  background-color: #667eea;
  color: #ffffff;
  border-radius: 15rpx;
  font-size: 22rpx;
}

.question-text {
  margin-bottom: 25rpx;
}

.question-text text {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
  line-height: 1.6;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e0e0e0;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.option-item.selected {
  border-color: #52c41a;
  background-color: #f6ffed;
}

.option-indicator {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-item.selected .option-indicator {
  border-color: #52c41a;
  background-color: #52c41a;
}

.check-icon {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: bold;
}

.option-text {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.5;
}

.option-score {
  font-size: 24rpx;
  color: #52c41a;
  font-weight: 500;
}

/* 评分结果 */
.scoring-result {
  margin: 0 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
}

.result-label {
  font-size: 28rpx;
  color: #666666;
  min-width: 100rpx;
}

.result-value {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.result-value.level {
  color: #667eea;
  font-weight: bold;
}

.result-value.desc {
  color: #666666;
  font-weight: normal;
  line-height: 1.6;
}
</style>
