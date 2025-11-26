<template>
  <view class="scale-fill-container">
    <!-- 进度条 -->
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>
    <view class="progress-text">
      <text>{{ currentQuestionIndex + 1 }}/{{ questions.length }}</text>
    </view>

    <!-- 量表标题 -->
    <view class="scale-header">
      <text class="scale-name">{{ scaleName }}</text>
    </view>

    <!-- 题目内容 -->
    <view v-if="currentQuestion" class="question-section">
      <view class="question-number">
        <text>第{{ currentQuestionIndex + 1 }}题</text>
      </view>
      <view class="question-text">
        <text>{{ currentQuestion.question }}</text>
      </view>

      <!-- 选项列表 -->
      <radio-group class="options-list" @change="onOptionChange">
        <label
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          class="option-item"
          :class="{ selected: answers[currentQuestionIndex] === index }"
        >
          <radio
            :value="index"
            :checked="answers[currentQuestionIndex] === index"
            color="#667eea"
          />
          <text class="option-text">{{ option.text }}</text>
        </label>
      </radio-group>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button
        v-if="currentQuestionIndex > 0"
        class="btn btn-prev"
        @click="handlePrev"
      >
        上一题
      </button>
      <button
        v-if="currentQuestionIndex < questions.length - 1"
        class="btn btn-next"
        :disabled="answers[currentQuestionIndex] === undefined"
        @click="handleNext"
      >
        下一题
      </button>
      <button
        v-if="currentQuestionIndex === questions.length - 1"
        class="btn btn-submit"
        :disabled="!isAllAnswered"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { scaleAPI } from '../../api/scale';

// 从页面参数获取
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1] as any;
const scaleCode = ref('');
const stage = ref('');

const scaleName = ref('');
const questions = ref<any[]>([]);
const answers = ref<any[]>([]);
const currentQuestionIndex = ref(0);
const submitting = ref(false);

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value];
});

// 进度百分比
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0;
  return Math.round(((currentQuestionIndex.value + 1) / questions.value.length) * 100);
});

// 是否全部回答
const isAllAnswered = computed(() => {
  return answers.value.every((a) => a !== undefined && a !== null);
});

// 加载量表
const loadScale = async () => {
  try {
    const result = await scaleAPI.getDetail(scaleCode.value);
    scaleName.value = result.name;
    questions.value = result.questions || [];
    answers.value = new Array(questions.value.length).fill(undefined);

    // 尝试从缓存恢复进度
    const cacheKey = `scale_progress_${scaleCode.value}_${stage.value}`;
    const cached = uni.getStorageSync(cacheKey);
    if (cached) {
      answers.value = cached.answers;
      currentQuestionIndex.value = cached.currentIndex;
    }
  } catch (error: any) {
    uni.showToast({
      title: '加载量表失败',
      icon: 'none',
    });
  }
};

// 选项改变
const onOptionChange = (e: any) => {
  const value = parseInt(e.detail.value);
  answers.value[currentQuestionIndex.value] = value;

  // 保存进度到缓存
  saveProgress();
};

// 保存进度
const saveProgress = () => {
  const cacheKey = `scale_progress_${scaleCode.value}_${stage.value}`;
  uni.setStorageSync(cacheKey, {
    answers: answers.value,
    currentIndex: currentQuestionIndex.value,
  });
};

// 上一题
const handlePrev = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    saveProgress();
  }
};

// 下一题
const handleNext = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    saveProgress();
  }
};

// 提交
const handleSubmit = async () => {
  if (!isAllAnswered.value) {
    uni.showToast({
      title: '请完成所有题目',
      icon: 'none',
    });
    return;
  }

  try {
    submitting.value = true;

    // 构建答题详情
    const answerDetails = questions.value.map((q, index) => ({
      questionId: q.id,
      question: q.question,
      answer: answers.value[index],
      score: q.options[answers.value[index]].score,
    }));

    // 计算总分
    const totalScore = answerDetails.reduce((sum, item) => sum + item.score, 0);

    // 提交到后端
    await scaleAPI.submit({
      scaleCode: scaleCode.value,
      stage: stage.value,
      answers: answerDetails,
      totalScore,
    });

    // 清除缓存
    const cacheKey = `scale_progress_${scaleCode.value}_${stage.value}`;
    uni.removeStorageSync(cacheKey);

    uni.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500,
    });

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  // 获取页面参数
  const options = currentPage.$page.options || {};
  scaleCode.value = options.code || '';
  stage.value = options.stage || '';

  if (scaleCode.value) {
    loadScale();
  }
});
</script>

<style scoped>
.scale-fill-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 进度条 */
.progress-bar {
  height: 6rpx;
  background-color: #e0e0e0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  padding: 20rpx;
  text-align: center;
  font-size: 24rpx;
  color: #999999;
}

/* 量表标题 */
.scale-header {
  padding: 30rpx;
  text-align: center;
}

.scale-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

/* 题目部分 */
.question-section {
  flex: 1;
  padding: 30rpx;
}

.question-number {
  margin-bottom: 20rpx;
}

.question-number text {
  display: inline-block;
  padding: 10rpx 20rpx;
  background-color: #667eea;
  color: #ffffff;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.question-text {
  margin-bottom: 40rpx;
}

.question-text text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
  line-height: 1.6;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  background-color: #ffffff;
  border: 2rpx solid #e0e0e0;
  border-radius: 15rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s ease;
}

.option-item.selected {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
}

/* 操作按钮 */
.action-buttons {
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #e0e0e0;
}

.btn {
  flex: 1;
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.btn-prev {
  background-color: #ffffff;
  color: #667eea;
  border: 2rpx solid #667eea;
}

.btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.btn-submit {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: #ffffff;
}

.btn[disabled] {
  opacity: 0.5;
}
</style>
