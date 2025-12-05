<template>
  <view class="register-container">
    <view class="form-container">
      <view class="form-item">
        <text class="label">姓名 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.name"
          placeholder="请输入姓名"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">性别 <text class="required">*</text></text>
        <radio-group class="radio-group" @change="onGenderChange">
          <label class="radio-label">
            <radio value="male" :checked="formData.gender === 'male'" color="#409EFF" />
            <text>男</text>
          </label>
          <label class="radio-label">
            <radio value="female" :checked="formData.gender === 'female'" color="#409EFF" />
            <text>女</text>
          </label>
        </radio-group>
      </view>

      <view class="form-item">
        <text class="label">出生日期 <text class="required">*</text></text>
        <picker
          mode="date"
          :value="formData.birthDate"
          @change="onBirthDateChange"
          :end="today"
        >
          <view class="picker">
            <text v-if="formData.birthDate">{{ formData.birthDate }}</text>
            <text v-else class="placeholder">请选择出生日期</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">联系电话 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.phone"
          placeholder="请输入联系电话"
          placeholder-class="placeholder"
          type="number"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <text class="label">紧急联系人</text>
        <input
          class="input"
          v-model="formData.emergencyContact"
          placeholder="请输入紧急联系人姓名"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">紧急联系电话</text>
        <input
          class="input"
          v-model="formData.emergencyPhone"
          placeholder="请输入紧急联系电话"
          placeholder-class="placeholder"
          type="number"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <text class="label">所属医院 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="hospitals"
          range-key="name"
          @change="onHospitalChange"
        >
          <view class="picker">
            <text v-if="selectedHospital">{{ selectedHospital.name }}</text>
            <text v-else class="placeholder">请选择医院</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">主治医生 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="doctorNames"
          @change="onDoctorChange"
          :disabled="!formData.hospitalId"
        >
          <view class="picker">
            <text v-if="selectedDoctor">{{ selectedDoctor.user?.name || selectedDoctor.name }}</text>
            <text v-else class="placeholder">请选择医生</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">诊断信息</text>
        <textarea
          class="textarea"
          v-model="formData.diagnosis"
          placeholder="请输入诊断信息"
          placeholder-class="placeholder"
          maxlength="500"
        />
      </view>

      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        提交注册
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { patientAPI } from '@/api/patient';
import { hospitalAPI } from '@/api/hospital';
import { doctorAPI } from '@/api/doctor';

const submitting = ref(false);
const hospitals = ref<any[]>([]);
const doctors = ref<any[]>([]);
const selectedHospital = ref<any>(null);
const selectedDoctor = ref<any>(null);

const today = new Date().toISOString().split('T')[0];

// 计算属性：提取医生姓名列表
const doctorNames = computed(() => {
  return doctors.value.map(doctor => doctor.user?.name || '未知医生');
});

const formData = ref({
  name: '',
  gender: 'male',
  birthDate: '',
  phone: '',
  emergencyContact: '',
  emergencyPhone: '',
  hospitalId: null as number | null,
  doctorId: null as number | null,
  diagnosis: '',
});

// 加载医院列表
const loadHospitals = async () => {
  try {
    const result = await hospitalAPI.getActive();
    hospitals.value = result;
  } catch (error: any) {
    uni.showToast({
      title: '加载医院列表失败',
      icon: 'none',
    });
  }
};

// 加载医生列表
const loadDoctors = async (hospitalId: number) => {
  try {
    const result = await doctorAPI.getList({ hospitalId, auditStatus: 'approved' });
    doctors.value = result.list || [];
  } catch (error: any) {
    uni.showToast({
      title: '加载医生列表失败',
      icon: 'none',
    });
  }
};

// 性别改变
const onGenderChange = (e: any) => {
  formData.value.gender = e.detail.value;
};

// 出生日期改变
const onBirthDateChange = (e: any) => {
  formData.value.birthDate = e.detail.value;
};

// 医院选择改变
const onHospitalChange = async (e: any) => {
  const index = e.detail.value;
  selectedHospital.value = hospitals.value[index];
  formData.value.hospitalId = selectedHospital.value.id;

  // 重置医生选择
  selectedDoctor.value = null;
  formData.value.doctorId = null;
  doctors.value = [];

  // 加载该医院的医生列表
  await loadDoctors(formData.value.hospitalId);
};

// 医生选择改变
const onDoctorChange = (e: any) => {
  const index = e.detail.value;
  selectedDoctor.value = doctors.value[index];
  formData.value.doctorId = selectedDoctor.value.id;
};

// 表单验证
const validateForm = () => {
  if (!formData.value.name) {
    uni.showToast({ title: '请输入姓名', icon: 'none' });
    return false;
  }
  if (!formData.value.birthDate) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' });
    return false;
  }
  if (!formData.value.phone) {
    uni.showToast({ title: '请输入联系电话', icon: 'none' });
    return false;
  }
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    uni.showToast({ title: '请输入正确的手机号码', icon: 'none' });
    return false;
  }
  if (!formData.value.hospitalId) {
    uni.showToast({ title: '请选择医院', icon: 'none' });
    return false;
  }
  if (!formData.value.doctorId) {
    uni.showToast({ title: '请选择医生', icon: 'none' });
    return false;
  }
  return true;
};

// 提交注册
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    submitting.value = true;
    await patientAPI.register(formData.value);

    uni.showToast({
      title: '注册成功',
      icon: 'success',
      duration: 1500,
    });

    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index',
      });
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '注册失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadHospitals();
});
</script>

<style scoped>
.register-container {
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
}

.radio-label {
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
</style>
