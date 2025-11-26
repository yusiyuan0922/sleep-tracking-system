<template>
  <view class="medication-add-container">
    <view class="form-container">
      <view class="form-item">
        <text class="label">药物名称 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.medicationName"
          placeholder="请输入药物名称"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">剂量(mg) <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.dosage"
          type="digit"
          placeholder="请输入剂量"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">用药频率 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.frequency"
          placeholder="例如: 每日一次、每日三次"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">开始日期 <text class="required">*</text></text>
        <picker
          mode="date"
          :value="formData.startDate"
          @change="onStartDateChange"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.startDate">{{ formData.startDate }}</text>
            <text v-else class="placeholder">请选择开始日期</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">结束日期</text>
        <picker
          mode="date"
          :value="formData.endDate"
          @change="onEndDateChange"
          :start="formData.startDate"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.endDate">{{ formData.endDate }}</text>
            <text v-else class="placeholder">选填,留空表示持续用药</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">所属阶段 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="stages"
          :value="stageIndex"
          @change="onStageChange"
        >
          <view class="picker">
            <text v-if="formData.stage">{{ formData.stage }}</text>
            <text v-else class="placeholder">请选择阶段</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">备注</text>
        <textarea
          class="textarea"
          v-model="formData.notes"
          placeholder="请输入备注信息"
          placeholder-class="placeholder"
          maxlength="500"
        />
      </view>

      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        提交
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { medicationAPI } from '../../api/medication';
import { patientAPI } from '../../api/patient';

const submitting = ref(false);
const today = new Date().toISOString().split('T')[0];

const stages = ['V1', 'V2', 'V3', 'V4'];
const stageIndex = ref(0);

const formData = ref({
  medicationName: '',
  dosage: '',
  frequency: '',
  startDate: '',
  endDate: '',
  stage: 'V1',
  notes: '',
});

// 开始日期改变
const onStartDateChange = (e: any) => {
  formData.value.startDate = e.detail.value;
};

// 结束日期改变
const onEndDateChange = (e: any) => {
  formData.value.endDate = e.detail.value;
};

// 阶段改变
const onStageChange = (e: any) => {
  stageIndex.value = e.detail.value;
  formData.value.stage = stages[stageIndex.value];
};

// 表单验证
const validateForm = () => {
  if (!formData.value.medicationName) {
    uni.showToast({ title: '请输入药物名称', icon: 'none' });
    return false;
  }
  if (!formData.value.dosage) {
    uni.showToast({ title: '请输入剂量', icon: 'none' });
    return false;
  }
  if (!formData.value.frequency) {
    uni.showToast({ title: '请输入用药频率', icon: 'none' });
    return false;
  }
  if (!formData.value.startDate) {
    uni.showToast({ title: '请选择开始日期', icon: 'none' });
    return false;
  }
  if (!formData.value.stage) {
    uni.showToast({ title: '请选择所属阶段', icon: 'none' });
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

    // 提交用药记录
    await medicationAPI.create({
      ...formData.value,
      patientId: patient.id,
      dosage: parseFloat(formData.value.dosage),
    });

    uni.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1500,
    });

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '添加失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.medication-add-container {
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

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 60rpx;
}
</style>
