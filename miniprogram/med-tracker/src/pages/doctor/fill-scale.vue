<template>
  <view class="fill-scale-container">
    <!-- 顶部信息 -->
    <view class="header-section">
      <text class="scale-title">{{ scaleCode }}量表</text>
      <text class="patient-info">患者: {{ patientName }} | 阶段: {{ stage }}</text>
      <view class="progress-section">
        <text class="progress-text">{{ currentQuestionIndex + 1 }}/{{ questions.length }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 题目区域 -->
    <view class="question-section">
      <view class="question-card">
        <text class="question-number">第 {{ currentQuestionIndex + 1 }} 题</text>
        <text class="question-text">{{ currentQuestion.question }}</text>

        <view class="options-list">
          <view
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option-item"
            :class="{ selected: answers[currentQuestionIndex] === index }"
            @click="selectAnswer(index)"
          >
            <view class="option-radio">
              <text v-if="answers[currentQuestionIndex] === index" class="radio-checked">●</text>
              <text v-else class="radio-unchecked">○</text>
            </view>
            <view class="option-content">
              <text class="option-text">{{ option.label || option.text }}</text>
              <text class="option-score">{{ option.value ?? option.score }}分</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 导航按钮 -->
    <view class="navigation-section">
      <button
        class="nav-btn secondary"
        @click="prevQuestion"
        :disabled="currentQuestionIndex === 0"
      >
        上一题
      </button>

      <button
        v-if="currentQuestionIndex < questions.length - 1"
        class="nav-btn primary"
        @click="nextQuestion"
        :disabled="answers[currentQuestionIndex] === null"
      >
        下一题
      </button>

      <button
        v-else
        class="nav-btn success"
        @click="handleSubmit"
        :disabled="!isAllAnswered"
        :loading="submitting"
      >
        提交
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { scaleAPI } from '../../api/scale';
import { patientAPI } from '../../api/patient';

const patientId = ref(0);
const patientName = ref('');
const scaleCode = ref('');
const scaleId = ref(0);
const stage = ref('');
const submitting = ref(false);

const questions = ref<any[]>([]);
const answers = ref<number[]>([]);
const currentQuestionIndex = ref(0);

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || {};
});

// 进度百分比
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0;
  return Math.round(((currentQuestionIndex.value + 1) / questions.value.length) * 100);
});

// 是否全部回答
const isAllAnswered = computed(() => {
  return answers.value.every(a => a !== null);
});

// 加载量表题目
const loadScale = async () => {
  try {
    const result = await scaleAPI.getDetail(scaleCode.value);
    scaleId.value = result.id;
    questions.value = result.questions || [];
    // 初始化答案数组
    answers.value = new Array(questions.value.length).fill(null);
  } catch (error: any) {
    uni.showToast({
      title: '加载量表失败',
      icon: 'none',
    });
  }
};

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getDetail(patientId.value);
    patientName.value = result.name;
  } catch (error: any) {
    console.error('加载患者信息失败:', error);
  }
};

// 选择答案
const selectAnswer = (optionIndex: number) => {
  answers.value[currentQuestionIndex.value] = optionIndex;

  // 如果不是最后一题,自动跳转到下一题
  if (currentQuestionIndex.value < questions.value.length - 1) {
    // 延迟300ms跳转,让用户看到选中效果
    setTimeout(() => {
      currentQuestionIndex.value++;
    }, 300);
  }
};

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
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

  uni.showModal({
    title: '确认提交',
    content: `确认提交${scaleCode.value}量表吗?`,
    success: async (res) => {
      if (res.confirm) {
        await submitScale();
      }
    },
  });
};

// 提交量表
const submitScale = async () => {
  try {
    submitting.value = true;

    // 构建答案数组(只提交分值)
    const answerValues = questions.value.map((q, index) => {
      const selectedOption = q.options[answers.value[index]];
      return selectedOption.value ?? selectedOption.score;
    });

    // 提交
    await scaleAPI.submit({
      patientId: patientId.value,
      scaleId: scaleId.value,
      stage: stage.value,
      answers: answerValues,
    });

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

onLoad((options: any) => {
  patientId.value = parseInt(options.patientId);
  scaleCode.value = options.scaleCode;
  stage.value = options.stage;

  loadScale();
  loadPatientInfo();
});
</script>

<style scoped>
.fill-scale-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 顶部信息 */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  color: #ffffff;
}

.scale-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 15rpx;
}

.patient-info {
  font-size: 24rpx;
  opacity: 0.9;
  display: block;
  margin-bottom: 30rpx;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.progress-text {
  font-size: 28rpx;
  font-weight: bold;
}

.progress-bar {
  height: 12rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #ffffff;
  transition: width 0.3s ease;
}

/* 题目区域 */
.question-section {
  flex: 1;
  padding: 30rpx;
  overflow-y: auto;
}

.question-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.question-number {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 20rpx;
}

.question-text {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.6;
  margin-bottom: 40rpx;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 25rpx;
  background-color: #f7f8fa;
  border-radius: 15rpx;
  border: 3rpx solid transparent;
  transition: all 0.3s;
}

.option-item.selected {
  background-color: #e6f7ff;
  border-color: #667eea;
}

.option-radio {
  margin-right: 20rpx;
  font-size: 32rpx;
}

.radio-checked {
  color: #667eea;
}

.radio-unchecked {
  color: #d9d9d9;
}

.option-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
}

.option-score {
  font-size: 24rpx;
  color: #999999;
  margin-left: 20rpx;
}

/* 导航按钮 */
.navigation-section {
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  gap: 20rpx;
}

.nav-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.nav-btn.primary {
  background-color: #667eea;
  color: #ffffff;
}

.nav-btn.secondary {
  background-color: #f7f8fa;
  color: #666666;
}

.nav-btn.success {
  background-color: #52c41a;
  color: #ffffff;
}

.nav-btn[disabled] {
  opacity: 0.5;
}
</style>
