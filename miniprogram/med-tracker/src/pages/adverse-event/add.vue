<template>
  <view class="adverse-event-add-container">
    <view class="form-container">
      <view class="form-item">
        <text class="label">事件名称 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.eventName"
          placeholder="请输入不良事件名称"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">严重程度 <text class="required">*</text></text>
        <radio-group class="radio-group" @change="onSeverityChange">
          <label class="radio-label">
            <radio value="mild" :checked="formData.severity === 'mild'" color="#13c2c2" />
            <text>轻度</text>
          </label>
          <label class="radio-label">
            <radio value="moderate" :checked="formData.severity === 'moderate'" color="#fa8c16" />
            <text>中度</text>
          </label>
          <label class="radio-label">
            <radio value="severe" :checked="formData.severity === 'severe'" color="#f5222d" />
            <text>重度</text>
          </label>
        </radio-group>
      </view>

      <view class="form-item">
        <text class="label">发生日期 <text class="required">*</text></text>
        <picker
          mode="date"
          :value="formData.occurredDate"
          @change="onOccurredDateChange"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.occurredDate">{{ formData.occurredDate }}</text>
            <text v-else class="placeholder">请选择发生日期</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">发生时间</text>
        <picker
          mode="time"
          :value="formData.occurredTime"
          @change="onOccurredTimeChange"
        >
          <view class="picker">
            <text v-if="formData.occurredTime">{{ formData.occurredTime }}</text>
            <text v-else class="placeholder">请选择发生时间</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">持续时间</text>
        <input
          class="input"
          v-model="formData.duration"
          placeholder="例如: 2小时、1天"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">与研究药物关系 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="relationships"
          range-key="label"
          :value="relationshipIndex"
          @change="onRelationshipChange"
        >
          <view class="picker">
            <text v-if="formData.relationship">{{ relationships.find(r => r.value === formData.relationship)?.label }}</text>
            <text v-else class="placeholder">请选择关系</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">是否采取医疗干预</text>
        <radio-group class="radio-group" @change="onInterventionChange">
          <label class="radio-label">
            <radio value="true" :checked="formData.medicalIntervention === true" color="#409EFF" />
            <text>是</text>
          </label>
          <label class="radio-label">
            <radio value="false" :checked="formData.medicalIntervention === false" color="#409EFF" />
            <text>否</text>
          </label>
        </radio-group>
      </view>

      <view v-if="formData.medicalIntervention" class="form-item">
        <text class="label">医疗干预措施</text>
        <textarea
          class="textarea"
          v-model="formData.interventionDetails"
          placeholder="请描述采取的医疗干预措施"
          placeholder-class="placeholder"
          maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="label">结果 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="outcomes"
          range-key="label"
          :value="outcomeIndex"
          @change="onOutcomeChange"
        >
          <view class="picker">
            <text v-if="formData.outcome">{{ outcomes.find(o => o.value === formData.outcome)?.label }}</text>
            <text v-else class="placeholder">请选择结果</text>
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
        <text class="label">详细描述</text>
        <textarea
          class="textarea"
          v-model="formData.description"
          placeholder="请详细描述不良事件的情况"
          placeholder-class="placeholder"
          maxlength="1000"
        />
      </view>

      <view class="form-item">
        <text class="label">附件(可选)</text>
        <view class="upload-section">
          <view v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
            <text class="file-name">{{ file.name }}</text>
            <text class="file-remove" @click="removeFile(index)">删除</text>
          </view>
          <button class="upload-btn" @click="handleUpload">
            <text class="upload-icon">📎</text>
            <text>上传附件</text>
          </button>
        </view>
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

const submitting = ref(false);
const today = new Date().toISOString().split('T')[0];

const stages = ['V1', 'V2', 'V3', 'V4'];
const stageIndex = ref(0);

const relationships = [
  { value: 'definitely_related', label: '肯定相关' },
  { value: 'probably_related', label: '可能相关' },
  { value: 'possibly_related', label: '可疑相关' },
  { value: 'unlikely_related', label: '可能无关' },
  { value: 'not_related', label: '肯定无关' },
];
const relationshipIndex = ref(0);

const outcomes = [
  { value: 'recovered', label: '已恢复' },
  { value: 'recovering', label: '恢复中' },
  { value: 'not_recovered', label: '未恢复' },
  { value: 'sequelae', label: '有后遗症' },
  { value: 'death', label: '死亡' },
  { value: 'unknown', label: '未知' },
];
const outcomeIndex = ref(0);

const uploadedFiles = ref<any[]>([]);

const formData = ref({
  eventName: '',
  severity: 'mild',
  occurredDate: '',
  occurredTime: '',
  duration: '',
  relationship: 'definitely_related',
  medicalIntervention: false,
  interventionDetails: '',
  outcome: 'recovered',
  stage: 'V1',
  description: '',
});

// 严重程度改变
const onSeverityChange = (e: any) => {
  formData.value.severity = e.detail.value;
};

// 发生日期改变
const onOccurredDateChange = (e: any) => {
  formData.value.occurredDate = e.detail.value;
};

// 发生时间改变
const onOccurredTimeChange = (e: any) => {
  formData.value.occurredTime = e.detail.value;
};

// 关系改变
const onRelationshipChange = (e: any) => {
  relationshipIndex.value = e.detail.value;
  formData.value.relationship = relationships[relationshipIndex.value].value;
};

// 医疗干预改变
const onInterventionChange = (e: any) => {
  formData.value.medicalIntervention = e.detail.value === 'true';
  if (!formData.value.medicalIntervention) {
    formData.value.interventionDetails = '';
  }
};

// 结果改变
const onOutcomeChange = (e: any) => {
  outcomeIndex.value = e.detail.value;
  formData.value.outcome = outcomes[outcomeIndex.value].value;
};

// 阶段改变
const onStageChange = (e: any) => {
  stageIndex.value = e.detail.value;
  formData.value.stage = stages[stageIndex.value];
};

// 上传附件
const handleUpload = async () => {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    });

    if (res[1].tempFilePaths && res[1].tempFilePaths.length > 0) {
      // TODO: 上传到服务器
      uploadedFiles.value.push({
        name: `附件${uploadedFiles.value.length + 1}`,
        path: res[1].tempFilePaths[0],
      });

      uni.showToast({
        title: '上传成功',
        icon: 'success',
      });
    }
  } catch (error: any) {
    console.error('选择图片失败:', error);
  }
};

// 删除附件
const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

// 表单验证
const validateForm = () => {
  if (!formData.value.eventName) {
    uni.showToast({ title: '请输入事件名称', icon: 'none' });
    return false;
  }
  if (!formData.value.occurredDate) {
    uni.showToast({ title: '请选择发生日期', icon: 'none' });
    return false;
  }
  if (!formData.value.relationship) {
    uni.showToast({ title: '请选择与研究药物关系', icon: 'none' });
    return false;
  }
  if (!formData.value.outcome) {
    uni.showToast({ title: '请选择结果', icon: 'none' });
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

    // 构建occurredAt
    let occurredAt = formData.value.occurredDate;
    if (formData.value.occurredTime) {
      occurredAt += ' ' + formData.value.occurredTime;
    }

    // 提交不良事件
    await adverseEventAPI.create({
      ...formData.value,
      patientId: patient.id,
      occurredAt,
      attachments: uploadedFiles.value.map(f => f.path),
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
    uni.showToast({
      title: error.message || '上报失败',
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
