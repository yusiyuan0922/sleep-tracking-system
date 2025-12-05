<template>
  <view class="adverse-event-add-container">
    <view class="form-container">
      <view class="form-item">
        <text class="label">不良事件名称 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.eventName"
          placeholder="请输入不良事件名称"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">开始日期 <text class="required">*</text></text>
        <picker
          mode="date"
          :value="formData.occurredDate"
          @change="onOccurredDateChange"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.occurredDate">{{ formData.occurredDate }}</text>
            <text v-else class="placeholder">请选择开始日期</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">开始时间</text>
        <picker
          mode="time"
          :value="formData.occurredTime"
          @change="onOccurredTimeChange"
        >
          <view class="picker">
            <text v-if="formData.occurredTime">{{ formData.occurredTime }}</text>
            <text v-else class="placeholder">请选择开始时间</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">是否持续 <text class="required">*</text></text>
        <radio-group class="radio-group" @change="onOngoingChange">
          <label class="radio-label">
            <radio value="true" :checked="formData.isOngoing === true" color="#409EFF" />
            <text>持续中</text>
          </label>
          <label class="radio-label">
            <radio value="false" :checked="formData.isOngoing === false" color="#409EFF" />
            <text>已结束</text>
          </label>
        </radio-group>
      </view>

      <view v-if="!formData.isOngoing" class="form-item">
        <text class="label">结束日期</text>
        <picker
          mode="date"
          :value="formData.endDate"
          @change="onEndDateChange"
          :start="formData.occurredDate"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.endDate">{{ formData.endDate }}</text>
            <text v-else class="placeholder">请选择结束日期</text>
          </view>
        </picker>
      </view>

      <view v-if="!formData.isOngoing" class="form-item">
        <text class="label">结束时间</text>
        <picker
          mode="time"
          :value="formData.endTime"
          @change="onEndTimeChange"
        >
          <view class="picker">
            <text v-if="formData.endTime">{{ formData.endTime }}</text>
            <text v-else class="placeholder">请选择结束时间</text>
          </view>
        </picker>
      </view>

      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        提交
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { adverseEventAPI } from '../../api/adverse-event';
import { patientAPI } from '../../api/patient';
import { formatErrorMessage } from '@/utils/request';

const submitting = ref(false);
const today = new Date().toISOString().split('T')[0];

const formData = ref({
  eventName: '',
  occurredDate: '',
  occurredTime: '',
  isOngoing: false,
  endDate: '',
  endTime: '',
});

// 发生日期改变
const onOccurredDateChange = (e: any) => {
  formData.value.occurredDate = e.detail.value;
};

// 发生时间改变
const onOccurredTimeChange = (e: any) => {
  formData.value.occurredTime = e.detail.value;
};

// 是否持续改变
const onOngoingChange = (e: any) => {
  formData.value.isOngoing = e.detail.value === 'true';
  if (formData.value.isOngoing) {
    formData.value.endDate = '';
    formData.value.endTime = '';
  }
};

// 结束日期改变
const onEndDateChange = (e: any) => {
  formData.value.endDate = e.detail.value;
};

// 结束时间改变
const onEndTimeChange = (e: any) => {
  formData.value.endTime = e.detail.value;
};

// 表单验证
const validateForm = () => {
  if (!formData.value.eventName) {
    uni.showToast({ title: '请输入不良事件名称', icon: 'none' });
    return false;
  }
  if (!formData.value.occurredDate) {
    uni.showToast({ title: '请选择开始日期', icon: 'none' });
    return false;
  }
  return true;
};

// 提交
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    submitting.value = true;

    // 获取患者信息
    const patient = await patientAPI.getMyInfo();

    // 构建onsetDate（开始时间）
    let onsetDate = formData.value.occurredDate;
    if (formData.value.occurredTime) {
      onsetDate += ' ' + formData.value.occurredTime;
    }

    // 构建endDate（结束时间）
    let endDate: string | undefined = undefined;
    if (!formData.value.isOngoing && formData.value.endDate) {
      endDate = formData.value.endDate;
      if (formData.value.endTime) {
        endDate += ' ' + formData.value.endTime;
      }
    }

    // 提交不良事件（只提交必要字段）
    await adverseEventAPI.create({
      patientId: Number(patient.id), // 确保转换为数字
      eventName: formData.value.eventName,
      severity: 'mild', // 默认轻度
      isSerious: false, // 默认非严重
      onsetDate,
      isOngoing: formData.value.isOngoing,
      endDate,
      description: formData.value.eventName, // 使用事件名称作为描述
      stage: patient.currentStage || 'V1', // 使用患者当前阶段
    });

    uni.showToast({
      title: '上报成功',
      icon: 'success',
      duration: 1500,
    });

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    console.error('上报不良事件失败:', error);
    uni.showToast({
      title: formatErrorMessage(error.message, '上报失败'),
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.adverse-event-add-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.form-container {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
}

.input,
.picker,
.textarea {
  width: 100%;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #333333;
}

.textarea {
  min-height: 150rpx;
}

.placeholder {
  color: #999999;
}

.radio-group {
  display: flex;
  gap: 40rpx;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333333;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
}

.file-name {
  font-size: 26rpx;
  color: #333333;
  flex: 1;
}

.file-remove {
  font-size: 24rpx;
  color: #f5222d;
  padding: 8rpx 16rpx;
}

.upload-btn {
  width: 100%;
  height: 80rpx;
  background-color: #f7f8fa;
  color: #666666;
  border-radius: 10rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border: 2rpx dashed #d9d9d9;
}

.upload-icon {
  font-size: 32rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 60rpx;
}
</style>
