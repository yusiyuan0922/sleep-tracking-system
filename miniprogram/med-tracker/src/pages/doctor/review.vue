<template>
  <view class="review-container">
    <!-- 患者信息 -->
    <view class="patient-info-card">
      <text class="info-title">患者信息</text>
      <view class="info-content">
        <text class="info-text">姓名: {{ patientInfo.user?.name || '患者' }}</text>
        <text class="info-text">编号: {{ patientInfo.patientNo }}</text>
        <text class="info-text">阶段: {{ stage }}</text>
      </view>
    </view>

    <!-- 完成情况检查 -->
    <view class="completion-card">
      <text class="card-title">完成情况检查</text>

      <view class="requirement-list">
        <view
          v-for="req in requirements"
          :key="req.type"
          class="requirement-item"
          :class="{ completed: req.completed }"
        >
          <view class="req-icon">
            <text v-if="req.completed">✓</text>
            <text v-else>✗</text>
          </view>
          <text class="req-text">{{ req.name }}</text>
        </view>
      </view>

      <view v-if="!canComplete" class="warning-box">
        <text class="warning-icon">⚠️</text>
        <text class="warning-text">该患者尚未完成所有必填项,无法通过审核</text>
      </view>
    </view>

    <!-- 审核意见 -->
    <view class="review-card">
      <text class="card-title">审核意见</text>
      <textarea
        class="review-textarea"
        v-model="reviewNotes"
        placeholder="请输入审核意见(可选)"
        placeholder-class="placeholder"
        maxlength="500"
      />
      <text class="char-count">{{ reviewNotes.length }}/500</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button
        class="action-btn reject"
        @click="handleReject"
        :loading="submitting"
      >
        驳回
      </button>
      <button
        class="action-btn approve"
        @click="handleApprove"
        :disabled="!canComplete"
        :loading="submitting"
      >
        通过
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { patientAPI } from '../../api/patient';

const patientId = ref(0);
const stage = ref('');
const patientInfo = ref<any>({});
const completionStatus = ref<any>({});
const reviewNotes = ref('');
const submitting = ref(false);

// 必填项列表
const requirements = computed(() => {
  const reqs = completionStatus.value.requirements || {};
  const completed = completionStatus.value.completedRequirements || [];

  const list: any[] = [];

  // 量表
  if (reqs.requiredScales) {
    reqs.requiredScales.forEach((code: string) => {
      const isCompleted = completed.some((r: any) => r.type === 'scale' && r.code === code);
      list.push({
        type: 'scale',
        name: `${code}量表`,
        completed: isCompleted,
      });
    });
  }

  // 病历文件
  if (reqs.requiresMedicalFiles) {
    const isCompleted = completed.some((r: any) => r.type === 'medicalFile');
    list.push({
      type: 'medicalFile',
      name: '病历文件',
      completed: isCompleted,
    });
  }

  // 用药记录
  if (reqs.requiresMedicationRecord) {
    const isCompleted = completed.some((r: any) => r.type === 'medicationRecord');
    list.push({
      type: 'medicationRecord',
      name: '用药记录',
      completed: isCompleted,
    });
  }

  // 合并用药
  if (reqs.requiresConcomitantMeds) {
    const isCompleted = completed.some((r: any) => r.type === 'concomitantMedication');
    list.push({
      type: 'concomitantMedication',
      name: '合并用药',
      completed: isCompleted,
    });
  }

  return list;
});

// 是否可以通过
const canComplete = computed(() => {
  return completionStatus.value.canComplete === true;
});

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getDetail(patientId.value);
    patientInfo.value = result;
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
};

// 加载完成状态
const loadCompletionStatus = async () => {
  try {
    const result = await patientAPI.getStageCompletionStatus(patientId.value);
    completionStatus.value = result;
  } catch (error: any) {
    uni.showToast({
      title: '加载完成状态失败',
      icon: 'none',
    });
  }
};

// 通过审核
const handleApprove = () => {
  uni.showModal({
    title: '确认通过',
    content: `确认通过${stage.value}阶段的审核吗?`,
    success: async (res) => {
      if (res.confirm) {
        await submitReview('approved');
      }
    },
  });
};

// 驳回审核
const handleReject = () => {
  if (!reviewNotes.value) {
    uni.showToast({
      title: '驳回时必须填写审核意见',
      icon: 'none',
    });
    return;
  }

  uni.showModal({
    title: '确认驳回',
    content: `确认驳回${stage.value}阶段吗?`,
    confirmText: '确认驳回',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        await submitReview('rejected');
      }
    },
  });
};

// 提交审核
const submitReview = async (decision: 'approved' | 'rejected') => {
  try {
    submitting.value = true;

    // 调用完成阶段API
    const methodName = `complete${stage.value}`;
    await patientAPI[methodName](patientId.value, {
      reviewDecision: decision,
      reviewNotes: reviewNotes.value,
    });

    uni.showToast({
      title: decision === 'approved' ? '审核通过' : '已驳回',
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
  stage.value = options.stage;

  loadPatientInfo();
  loadCompletionStatus();
});
</script>

<style scoped>
.review-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  padding-bottom: 150rpx;
}

/* 患者信息卡片 */
.patient-info-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666666;
}

/* 完成情况卡片 */
.completion-card,
.review-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 30rpx;
}

.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
}

.requirement-item.completed {
  background-color: #e6fffb;
}

.req-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  background-color: #ff4d4f;
  color: #ffffff;
}

.requirement-item.completed .req-icon {
  background-color: #52c41a;
}

.req-text {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 20rpx;
  background-color: #fff7e6;
  border-radius: 10rpx;
  border-left: 6rpx solid #fa8c16;
}

.warning-icon {
  font-size: 32rpx;
}

.warning-text {
  flex: 1;
  font-size: 24rpx;
  color: #fa8c16;
  line-height: 1.5;
}

/* 审核意见 */
.review-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
}

.placeholder {
  color: #999999;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999999;
  margin-top: 10rpx;
}

/* 操作按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.action-btn.reject {
  background-color: #ff4d4f;
  color: #ffffff;
}

.action-btn.approve {
  background-color: #52c41a;
  color: #ffffff;
}

.action-btn[disabled] {
  opacity: 0.5;
}
</style>
