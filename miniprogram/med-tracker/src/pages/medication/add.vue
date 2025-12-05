<template>
  <view class="medication-add-container">
    <!-- 页面标题 -->
    <view class="page-title">
      <text>{{ pageTitle }}</text>
    </view>

    <view class="form-container">
      <view class="form-item">
        <text class="label">药品通用名 <text v-if="!isRecordType" class="required">*</text></text>

        <!-- 莱博雷生: 显示为不可编辑 -->
        <view v-if="isRecordType" class="input input-disabled">莱博雷生</view>

        <!-- 合并用药: 可编辑输入框 -->
        <input
          v-else
          class="input"
          v-model="formData.drugName"
          placeholder="请输入其他药品名称"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 合并用药: 剂型字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">剂型 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="dosageForms"
          :value="dosageFormIndex"
          @change="onDosageFormChange"
        >
          <view class="picker">
            <text v-if="formData.dosageForm">{{ formData.dosageForm }}</text>
            <text v-else class="placeholder">请选择剂型</text>
          </view>
        </picker>
      </view>

      <!-- 合并用药: 给药途径字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">给药途径 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="routes"
          :value="routeIndex"
          @change="onRouteChange"
        >
          <view class="picker">
            <text v-if="formData.route">{{ formData.route }}</text>
            <text v-else class="placeholder">请选择给药途径</text>
          </view>
        </picker>
      </view>

      <!-- 合并用药: 给药频率字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">给药频率 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.frequency"
          placeholder="例如: 每日1次"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">单次剂量 <text class="required">*</text></text>

        <!-- 莱博雷生: 选择器 (5mg/10mg) -->
        <picker
          v-if="isRecordType"
          mode="selector"
          :range="dosageOptions"
          :value="dosageIndex"
          @change="onDosageChange"
        >
          <view class="picker">
            <text v-if="formData.dosage">{{ formData.dosage }}mg</text>
            <text v-else class="placeholder">请选择剂量 (5mg/10mg)</text>
          </view>
        </picker>

        <!-- 合并用药: 数字输入 -->
        <input
          v-else
          class="input"
          v-model="formData.dosage"
          type="digit"
          placeholder="请输入单次剂量"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 合并用药: 单位字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">单位 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="units"
          :value="unitIndex"
          @change="onUnitChange"
        >
          <view class="picker">
            <text v-if="formData.unit">{{ formData.unit }}</text>
            <text v-else class="placeholder">请选择单位</text>
          </view>
        </picker>
      </view>

      <!-- 合并用药: 使用原因字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">使用原因 <text class="required">*</text></text>
        <textarea
          class="textarea"
          v-model="formData.indication"
          placeholder="请输入使用原因/适应症"
          placeholder-class="placeholder"
          maxlength="200"
        />
      </view>

      <!-- 合并用药: 开始日期字段 -->
      <view v-if="!isRecordType" class="form-item">
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

      <!-- 合并用药: 是否持续用药字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">是否持续用药 <text class="required">*</text></text>
        <view class="radio-group">
          <label class="radio-item" @click="formData.isContinuous = true">
            <radio :checked="formData.isContinuous" color="#667eea" />
            <text>是</text>
          </label>
          <label class="radio-item" @click="formData.isContinuous = false">
            <radio :checked="!formData.isContinuous" color="#667eea" />
            <text>否</text>
          </label>
        </view>
      </view>

      <!-- 合并用药: 结束日期字段 -->
      <view v-if="!isRecordType && !formData.isContinuous" class="form-item">
        <text class="label">结束日期 <text class="required">*</text></text>
        <picker
          mode="date"
          :value="formData.endDate"
          @change="onEndDateChange"
          :start="formData.startDate"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.endDate">{{ formData.endDate }}</text>
            <text v-else class="placeholder">请选择结束日期</text>
          </view>
        </picker>
      </view>

      <!-- 合并用药: 备注字段 -->
      <view v-if="!isRecordType" class="form-item">
        <text class="label">备注</text>
        <textarea
          class="textarea"
          v-model="formData.remark"
          placeholder="请输入备注信息(选填)"
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
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { medicationAPI } from '../../api/medication';
import { patientAPI } from '../../api/patient';

// 页面参数: type = 'record' (用药记录/莱博雷生) 或 'concomitant' (合并用药)
const medicationType = ref<'record' | 'concomitant'>('record');

const submitting = ref(false);
const today = new Date().toISOString().split('T')[0];

// 莱博雷生用药记录的默认值
const DEFAULT_RECORD_VALUES = {
  drugName: '莱博雷生',
  specification: '片剂',
  unit: 'mg',
  frequency: '每日1次',
  route: '口服',
  indication: '失眠治疗'
};

// 剂量选项（莱博雷生专用）
const dosageOptions = ['5', '10'];
const dosageIndex = ref(-1);

// 页面标题
const pageTitle = computed(() => {
  return medicationType.value === 'record' ? '填写用药记录（莱博雷生）' : '填写合并用药';
});

// 药品名称提示
const drugNamePlaceholder = computed(() => {
  return medicationType.value === 'record' ? '莱博雷生' : '请输入其他药品名称';
});

// 计算属性: 是否为莱博雷生记录
const isRecordType = computed(() => medicationType.value === 'record');

// 剂量选择器改变事件
const onDosageChange = (e: any) => {
  dosageIndex.value = e.detail.value;
  formData.value.dosage = dosageOptions[dosageIndex.value];
};

// 页面加载时获取类型参数
onLoad((options: any) => {
  console.log('=== medication/add 页面加载 ===');
  console.log('页面参数 options:', options);

  if (options?.type === 'concomitant') {
    medicationType.value = 'concomitant';
    console.log('设置为: 合并用药');
  } else {
    medicationType.value = 'record';
    // 莱博雷生: 预填充药品名称
    formData.value.drugName = DEFAULT_RECORD_VALUES.drugName;
    console.log('设置为: 用药记录(莱博雷生)');
  }

  console.log('最终 medicationType:', medicationType.value);
  console.log('pageTitle:', pageTitle.value);
  console.log('=== 页面加载完成 ===');
});

// 剂型列表
const dosageForms = ['片剂', '胶囊', '注射液', '口服液', '颗粒剂', '软膏', '栓剂', '其他'];
const dosageFormIndex = ref(-1);

// 给药途径列表
const routes = ['口服', '静脉注射', '肌肉注射', '皮下注射', '外用', '其他'];
const routeIndex = ref(-1);

// 剂量单位列表
const units = ['mg', 'g', 'ml', 'IU', '片', '粒', '支', '袋'];
const unitIndex = ref(-1);

const formData = ref({
  drugName: '',
  dosageForm: '',
  route: '',
  frequency: '',
  dosage: '',
  unit: '',
  indication: '',
  startDate: '',
  isContinuous: true,
  endDate: '',
  remark: '',
});

// 剂型改变
const onDosageFormChange = (e: any) => {
  dosageFormIndex.value = e.detail.value;
  formData.value.dosageForm = dosageForms[dosageFormIndex.value];
};

// 给药途径改变
const onRouteChange = (e: any) => {
  routeIndex.value = e.detail.value;
  formData.value.route = routes[routeIndex.value];
};

// 剂量单位改变
const onUnitChange = (e: any) => {
  unitIndex.value = e.detail.value;
  formData.value.unit = units[unitIndex.value];
};

// 开始日期改变
const onStartDateChange = (e: any) => {
  formData.value.startDate = e.detail.value;
};

// 结束日期改变
const onEndDateChange = (e: any) => {
  formData.value.endDate = e.detail.value;
};

// 表单验证
const validateForm = () => {
  // 莱博雷生：只验证剂量
  if (isRecordType.value) {
    if (!formData.value.dosage) {
      uni.showToast({ title: '请选择单次剂量', icon: 'none' });
      return false;
    }
    return true; // 仅此一项验证
  }

  // 合并用药：验证所有字段
  if (!formData.value.drugName.trim()) {
    uni.showToast({ title: '请输入药品通用名', icon: 'none' });
    return false;
  }
  if (!formData.value.dosageForm) {
    uni.showToast({ title: '请选择剂型', icon: 'none' });
    return false;
  }
  if (!formData.value.route) {
    uni.showToast({ title: '请选择给药途径', icon: 'none' });
    return false;
  }
  if (!formData.value.frequency.trim()) {
    uni.showToast({ title: '请输入给药频率', icon: 'none' });
    return false;
  }
  if (!formData.value.dosage) {
    uni.showToast({ title: '请输入单次剂量', icon: 'none' });
    return false;
  }
  const dosageNum = parseFloat(formData.value.dosage);
  if (isNaN(dosageNum) || dosageNum <= 0) {
    uni.showToast({ title: '请输入有效的剂量', icon: 'none' });
    return false;
  }
  if (!formData.value.unit) {
    uni.showToast({ title: '请选择单位', icon: 'none' });
    return false;
  }
  if (!formData.value.indication.trim()) {
    uni.showToast({ title: '请输入使用原因', icon: 'none' });
    return false;
  }
  if (!formData.value.startDate) {
    uni.showToast({ title: '请选择开始日期', icon: 'none' });
    return false;
  }
  if (!formData.value.isContinuous && !formData.value.endDate) {
    uni.showToast({ title: '请选择结束日期', icon: 'none' });
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

    // 确保 patientId 是数字类型
    const patientId = typeof patient.id === 'string'
      ? parseInt(patient.id, 10)
      : patient.id;

    let submitData;
    let apiCall;

    if (isRecordType.value) {
      // 莱博雷生用药记录：只有剂量来自用户输入，其他全部使用默认值
      submitData = {
        patientId,
        drugName: DEFAULT_RECORD_VALUES.drugName,       // 固定：莱博雷生
        specification: DEFAULT_RECORD_VALUES.specification,  // 固定：片剂
        dosage: parseFloat(formData.value.dosage),      // ⭐ 用户选择：5 或 10
        unit: DEFAULT_RECORD_VALUES.unit,               // 固定：mg
        frequency: DEFAULT_RECORD_VALUES.frequency,     // 固定：每日1次
        route: DEFAULT_RECORD_VALUES.route,             // 固定：口服
        startDate: today,                               // 固定：当天
        endDate: undefined,                             // 固定：持续用药
        indication: DEFAULT_RECORD_VALUES.indication,   // 固定：失眠治疗
        remark: undefined,                              // 固定：无备注
      };
      console.log('提交用药记录数据(莱博雷生):', submitData);
      apiCall = medicationAPI.createRecord(submitData);

    } else {
      // 合并用药：使用表单填写的值
      submitData = {
        patientId,
        drugName: formData.value.drugName.trim(),
        specification: formData.value.dosageForm, // 使用剂型作为规格
        dosage: parseFloat(formData.value.dosage),
        unit: formData.value.unit,
        frequency: formData.value.frequency.trim(),
        route: formData.value.route,
        startDate: formData.value.startDate,
        endDate: formData.value.isContinuous ? undefined : formData.value.endDate,
        indication: formData.value.indication.trim(),
        remark: formData.value.remark.trim() || undefined,
      };
      console.log('提交合并用药数据:', submitData);
      apiCall = medicationAPI.createConcomitant(submitData);
    }

    await apiCall;

    uni.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1000,
    });

    // 返回上一页
    setTimeout(() => {
      console.log('准备返回上一页');
      uni.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回成功');
        },
        fail: () => {
          console.log('返回失败,跳转到列表页');
          // 如果返回失败,尝试跳转到列表页
          uni.redirectTo({
            url: '/pages/medication/list',
          });
        },
      });
    }, 1000);
  } catch (error: any) {
    console.error('提交失败:', error);
    uni.showToast({
      title: error.message || '添加失败',
      icon: 'none',
      duration: 2000,
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

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  text-align: center;
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
  gap: 60rpx;
  padding: 20rpx 0;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333333;
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

/* 禁用输入框样式 */
.input-disabled {
  background-color: #f0f0f0;
  color: #999999;
  cursor: not-allowed;
  display: flex;
  align-items: center;
}
</style>
