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
          <text class="option-text">{{ option.label }}</text>
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
import { onLoad } from '@dcloudio/uni-app';
import { scaleAPI } from '../../api/scale';
import { patientAPI } from '../../api/patient';

const scaleCode = ref('');
const stage = ref('');

const scaleId = ref(0);
const scaleName = ref('');
const questions = ref<any[]>([]);
const answers = ref<any[]>([]);
const currentQuestionIndex = ref(0);
const submitting = ref(false);
const patientId = ref(0);

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
    console.log('开始加载量表:', scaleCode.value);
    const result = await scaleAPI.getDetail(scaleCode.value);
    console.log('量表数据:', result);

    // 确保 scaleId 是数字类型
    scaleId.value = typeof result.id === 'string'
      ? parseInt(result.id, 10)
      : result.id;
    scaleName.value = result.name;
    questions.value = result.questions || [];

    console.log('题目数量:', questions.value.length);
    if (questions.value.length > 0) {
      console.log('第一题:', questions.value[0]);
    }

    answers.value = new Array(questions.value.length).fill(undefined);

    // 尝试从缓存恢复进度
    const cacheKey = `scale_progress_${scaleCode.value}_${stage.value}`;
    const cached = uni.getStorageSync(cacheKey);
    if (cached) {
      answers.value = cached.answers;
      currentQuestionIndex.value = cached.currentIndex;
    }
  } catch (error: any) {
    console.error('加载量表失败:', error);
    uni.showToast({
      title: error.message || '加载量表失败',
      icon: 'none',
      duration: 3000,
    });
  }
};

// 选项改变
const onOptionChange = (e: any) => {
  const value = parseInt(e.detail.value);
  answers.value[currentQuestionIndex.value] = value;

  // 保存进度到缓存
  saveProgress();

  // 如果不是最后一题,自动跳转到下一题
  if (currentQuestionIndex.value < questions.value.length - 1) {
    // 延迟300ms跳转,让用户看到选中效果
    setTimeout(() => {
      currentQuestionIndex.value++;
      saveProgress();
    }, 300);
  }
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

    // 获取选项值数组 (每题选择的选项的value值)
    const answerValues = questions.value.map((q, index) => {
      const selectedOptionIndex = answers.value[index];
      return q.options[selectedOptionIndex].value;
    });

    // 准备提交数据
    const submitData = {
      patientId: patientId.value,
      scaleId: scaleId.value,
      stage: stage.value,
      answers: answerValues,
    };

    console.log('提交数据:', submitData);
    console.log('数据类型检查:', {
      patientId: typeof submitData.patientId,
      scaleId: typeof submitData.scaleId,
      stage: typeof submitData.stage,
      answers: Array.isArray(submitData.answers),
    });

    // 提交到后端
    await scaleAPI.submit(submitData);

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
    console.error('提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};

// 使用 onLoad 接收页面参数
onLoad(async (options: any) => {
  console.log('页面参数:', options);
  scaleCode.value = options.code || '';
  stage.value = options.stage || '';
  console.log('scaleCode:', scaleCode.value, 'stage:', stage.value);

  // 获取患者信息
  try {
    const patientInfo = await patientAPI.getMyInfo();
    // 确保 patientId 是数字类型
    patientId.value = typeof patientInfo.id === 'string'
      ? parseInt(patientInfo.id, 10)
      : patientInfo.id;
    console.log('患者ID:', patientId.value, '类型:', typeof patientId.value);
  } catch (error: any) {
    console.error('获取患者信息失败:', error);
    uni.showToast({
      title: '获取患者信息失败',
      icon: 'none',
    });
    return;
  }

  if (scaleCode.value) {
    console.log('准备加载量表...');
    await loadScale();
  } else {
    console.error('缺少量表代码参数');
    uni.showToast({
      title: '缺少量表代码参数',
      icon: 'none',
    });
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
