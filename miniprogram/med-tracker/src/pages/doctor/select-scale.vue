<template>
  <view class="select-scale-container">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view class="step" :class="{ active: step === 1, completed: step > 1 }">
        <text class="step-number">1</text>
        <text class="step-text">选择患者</text>
      </view>
      <view class="step-line" :class="{ completed: step > 1 }"></view>
      <view class="step" :class="{ active: step === 2 }">
        <text class="step-number">2</text>
        <text class="step-text">选择量表</text>
      </view>
    </view>

    <!-- 步骤1: 选择患者 -->
    <view v-if="step === 1" class="step-content">
      <view class="section-header">
        <text class="section-title">请选择患者</text>
        <text class="section-hint">仅显示需要医生代填量表的患者</text>
      </view>

      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索患者姓名或编号"
          class="search-input"
        />
      </view>

      <!-- 患者列表 -->
      <view class="patient-list">
        <view
          v-for="patient in filteredPatients"
          :key="patient.id"
          class="patient-item"
          :class="{
            selected: selectedPatient?.id === patient.id,
            'all-completed': patient.allScalesCompleted
          }"
          @click="selectPatient(patient)"
        >
          <view class="patient-avatar" :class="{ 'avatar-completed': patient.allScalesCompleted }">
            <text v-if="patient.allScalesCompleted">✓</text>
            <text v-else>{{ patient.name?.charAt(0) }}</text>
          </view>
          <view class="patient-info">
            <view class="name-row">
              <text class="patient-name">{{ patient.name }}</text>
              <view class="stage-badge">{{ getStageDisplayName(patient.currentStage) }}</view>
            </view>
            <text class="patient-code">编号: {{ patient.patientCode }}</text>
            <text v-if="patient.allScalesCompleted" class="patient-completed-tag">医生量表已完成</text>
          </view>
          <view class="check-icon" v-if="!patient.allScalesCompleted">
            <text v-if="selectedPatient?.id === patient.id">✓</text>
          </view>
        </view>

        <view v-if="filteredPatients.length === 0 && !loading" class="empty-state">
          <text class="empty-text">{{ searchKeyword ? '未找到匹配的患者' : '暂无患者' }}</text>
        </view>

        <view v-if="loading" class="loading-state">
          <text>加载中...</text>
        </view>
      </view>

      <view class="bottom-action">
        <button
          class="action-btn primary"
          :disabled="!selectedPatient"
          @click="goToStep2"
        >
          下一步：选择量表
        </button>
      </view>
    </view>

    <!-- 步骤2: 选择量表 -->
    <view v-if="step === 2" class="step-content">
      <view class="section-header">
        <text class="section-title">请选择要填写的量表</text>
        <text class="section-hint">{{ selectedPatient?.name }} - {{ getStageDisplayName(selectedPatient?.currentStage) }}阶段</text>
      </view>

      <!-- 量表列表 -->
      <view class="scale-list">
        <view
          v-for="scale in doctorScales"
          :key="scale.code"
          class="scale-item"
          :class="{
            selected: selectedScale?.code === scale.code,
            completed: scale.completed,
            disabled: scale.completed
          }"
          @click="selectScale(scale)"
        >
          <view class="scale-icon" :class="{ 'completed-icon': scale.completed }">
            <text v-if="scale.completed">✓</text>
            <text v-else>📊</text>
          </view>
          <view class="scale-info">
            <text class="scale-name">{{ scale.name }}</text>
            <text class="scale-desc">{{ scale.description }}</text>
            <text v-if="scale.completed" class="completed-tag">已完成</text>
          </view>
          <view class="check-icon" v-if="!scale.completed">
            <text v-if="selectedScale?.code === scale.code">✓</text>
          </view>
        </view>
      </view>

      <view class="bottom-action">
        <button class="action-btn secondary" @click="goToStep1">
          上一步
        </button>
        <button
          class="action-btn primary"
          :disabled="!selectedScale"
          @click="startFillScale"
        >
          开始填写
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { doctorAPI } from '../../api/doctor';
import { scaleAPI } from '../../api/scale';
import { getStageDisplayName } from '../../utils/stage';

const step = ref(1);
const loading = ref(false);
const searchKeyword = ref('');
const patients = ref<any[]>([]);
const selectedPatient = ref<any>(null);
const selectedScale = ref<any>(null);
const completedScales = ref<string[]>([]); // 当前患者已完成的量表代码

// 医生代填量表列表
const doctorScales = ref([
  { code: 'HAMA', name: 'HAMA 汉密尔顿焦虑量表', description: '14道题，由医生评定', completed: false },
  { code: 'HAMD', name: 'HAMD 汉密尔顿抑郁量表', description: '17道题，由医生评定', completed: false },
]);

// 筛选患者列表（未完成的排在上面）
const filteredPatients = computed(() => {
  let list = patients.value;

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(p =>
      p.name?.toLowerCase().includes(keyword) ||
      p.patientCode?.toLowerCase().includes(keyword)
    );
  }

  // 排序：未完成的排在上面
  return [...list].sort((a, b) => {
    if (a.allScalesCompleted === b.allScalesCompleted) return 0;
    return a.allScalesCompleted ? 1 : -1;
  });
});

// 检查患者的医生量表完成情况
const checkPatientScalesCompleted = async (patient: any) => {
  try {
    const records = await scaleAPI.getPatientStageRecords(patient.id, patient.currentStage);
    const completedCodes = (records || []).map((r: any) => r.scale?.code || r.scaleCode);
    // 检查 HAMA 和 HAMD 是否都已完成
    const hamaCompleted = completedCodes.includes('HAMA');
    const hamdCompleted = completedCodes.includes('HAMD');
    return hamaCompleted && hamdCompleted;
  } catch (error) {
    return false;
  }
};

// 加载患者列表
const loadPatients = async () => {
  try {
    loading.value = true;
    const result = await doctorAPI.getMyPatients();
    const list = result.items || result || [];
    // 只显示 V1 和 V3 阶段的患者（这些阶段需要医生代填量表）
    const filteredList = Array.isArray(list)
      ? list.filter((p: any) => p.currentStage === 'V1' || p.currentStage === 'V3')
      : [];

    // 检查每个患者的量表完成情况
    const patientsWithStatus = await Promise.all(
      filteredList.map(async (p: any) => ({
        ...p,
        allScalesCompleted: await checkPatientScalesCompleted(p)
      }))
    );

    patients.value = patientsWithStatus;
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 选择患者
const selectPatient = (patient: any) => {
  if (patient.allScalesCompleted) {
    uni.showToast({ title: '该患者医生量表已全部完成', icon: 'none' });
    return;
  }
  selectedPatient.value = patient;
};

// 选择量表
const selectScale = (scale: any) => {
  if (scale.completed) {
    uni.showToast({ title: '该量表已完成', icon: 'none' });
    return;
  }
  selectedScale.value = scale;
};

// 加载患者已完成的量表
const loadCompletedScales = async () => {
  if (!selectedPatient.value) return;

  try {
    const records = await scaleAPI.getPatientStageRecords(
      selectedPatient.value.id,
      selectedPatient.value.currentStage
    );

    // 提取已完成的量表代码 (后端返回的关联字段是 scale)
    const completed = (records || []).map((r: any) => r.scale?.code || r.scaleCode);
    completedScales.value = completed;

    // 更新量表列表的完成状态
    doctorScales.value = doctorScales.value.map(scale => ({
      ...scale,
      completed: completed.includes(scale.code)
    }));
  } catch (error) {
    console.error('加载已完成量表失败:', error);
  }
};

// 步骤导航
const goToStep1 = () => {
  step.value = 1;
  selectedScale.value = null;
  completedScales.value = [];
};

const goToStep2 = async () => {
  if (!selectedPatient.value) {
    uni.showToast({ title: '请先选择患者', icon: 'none' });
    return;
  }

  // 加载已完成的量表
  await loadCompletedScales();
  step.value = 2;
};

// 开始填写量表
const startFillScale = () => {
  if (!selectedPatient.value || !selectedScale.value) {
    uni.showToast({ title: '请完成选择', icon: 'none' });
    return;
  }

  uni.navigateTo({
    url: `/pages/doctor/fill-scale?patientId=${selectedPatient.value.id}&scaleCode=${selectedScale.value.code}&stage=${selectedPatient.value.currentStage}`,
  });
};

onMounted(() => {
  loadPatients();
});

// 页面显示时刷新状态（从填写页面返回时）
onShow(async () => {
  if (step.value === 2 && selectedPatient.value) {
    // 清除之前选中的量表
    selectedScale.value = null;
    // 重新加载已完成量表状态
    await loadCompletedScales();

    // 检查当前患者是否所有量表都已完成
    const allCompleted = doctorScales.value.every(s => s.completed);
    if (allCompleted) {
      // 如果都完成了，返回步骤1并刷新患者列表
      uni.showToast({ title: '该患者医生量表已全部完成', icon: 'success' });
      step.value = 1;
      selectedPatient.value = null;
      // 重置量表列表状态
      doctorScales.value = doctorScales.value.map(s => ({ ...s, completed: false }));
      await loadPatients();
    }
  } else if (step.value === 1) {
    // 在步骤1时也刷新患者列表，确保状态最新
    await loadPatients();
  }
});
</script>

<style scoped>
.select-scale-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 步骤指示器 */
.step-indicator {
  background-color: #ffffff;
  padding: 40rpx 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
}

.step.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.step.completed .step-number {
  background-color: #52c41a;
  color: #ffffff;
}

.step-text {
  font-size: 24rpx;
  color: #999999;
}

.step.active .step-text,
.step.completed .step-text {
  color: #333333;
  font-weight: 500;
}

.step-line {
  width: 100rpx;
  height: 4rpx;
  background-color: #e0e0e0;
  margin: 0 20rpx;
  margin-bottom: 30rpx;
}

.step-line.completed {
  background-color: #52c41a;
}

/* 步骤内容 */
.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 140rpx;
}

.section-header {
  padding: 30rpx;
  background-color: #ffffff;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 10rpx;
}

.section-hint {
  font-size: 26rpx;
  color: #999999;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background-color: #f7f8fa;
  padding: 20rpx 30rpx;
  margin: 20rpx 30rpx;
  border-radius: 40rpx;
  gap: 15rpx;
}

.search-icon {
  font-size: 32rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

/* 患者列表 */
.patient-list {
  flex: 1;
  padding: 0 30rpx;
  overflow-y: auto;
}

.patient-item {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 25rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  gap: 20rpx;
  border: 3rpx solid transparent;
}

.patient-item.selected {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.patient-avatar {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.patient-item.all-completed .patient-avatar,
.patient-avatar.avatar-completed {
  background: #52c41a !important;
}

.patient-item.all-completed {
  background-color: #f5f5f5;
  opacity: 0.7;
}

.patient-item.all-completed .patient-name {
  color: #999999;
}

.patient-completed-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background-color: #52c41a;
  color: #ffffff;
  border-radius: 8rpx;
  font-size: 20rpx;
  width: fit-content;
}

.patient-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.patient-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.stage-badge {
  padding: 4rpx 14rpx;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 16rpx;
  font-size: 22rpx;
}

.patient-code {
  font-size: 24rpx;
  color: #999999;
}

.check-icon {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: #667eea;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  opacity: 0;
}

.patient-item.selected .check-icon,
.scale-item.selected .check-icon {
  opacity: 1;
}

/* 量表列表 */
.scale-list {
  flex: 1;
  padding: 20rpx 30rpx;
}

.scale-item {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  gap: 20rpx;
  border: 3rpx solid transparent;
}

.scale-item.selected {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.scale-item.completed {
  background-color: #f5f5f5;
  opacity: 0.7;
}

.scale-item.disabled {
  pointer-events: auto;
}

.scale-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #f6ffed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.scale-icon.completed-icon {
  background-color: #52c41a;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
}

.scale-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.scale-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.scale-item.completed .scale-name {
  color: #999999;
}

.scale-desc {
  font-size: 24rpx;
  color: #999999;
}

.completed-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background-color: #52c41a;
  color: #ffffff;
  border-radius: 8rpx;
  font-size: 20rpx;
  width: fit-content;
}

/* 空状态和加载状态 */
.empty-state,
.loading-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

/* 底部操作 */
.bottom-action {
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
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.action-btn.secondary {
  background-color: #f7f8fa;
  color: #666666;
}

.action-btn[disabled] {
  opacity: 0.5;
}
</style>
