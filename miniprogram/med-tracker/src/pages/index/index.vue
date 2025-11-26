<template>
  <view class="home-container">
    <!-- 患者信息卡片 -->
    <view class="patient-card">
      <view class="patient-header">
        <view class="patient-info">
          <text class="patient-name">{{ patientInfo.name }}</text>
          <text class="patient-code">编号: {{ patientInfo.patientCode }}</text>
        </view>
        <view class="stage-badge" :class="'stage-' + currentStage.toLowerCase()">
          {{ currentStage }}
        </view>
      </view>
      <view class="patient-detail">
        <text class="detail-item">医院: {{ patientInfo.hospital?.name }}</text>
        <text class="detail-item">医生: {{ patientInfo.doctor?.name }}</text>
        <text class="detail-item">入组日期: {{ patientInfo.enrollmentDate }}</text>
      </view>
    </view>

    <!-- 当前阶段进度 -->
    <view class="stage-progress">
      <view class="progress-header">
        <text class="progress-title">当前阶段进度</text>
        <text class="progress-percent">{{ completionPercent }}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: completionPercent + '%' }"></view>
      </view>
    </view>

    <!-- 任务列表 -->
    <view class="task-list">
      <view class="task-header">
        <text class="task-title">待完成任务</text>
        <text class="task-count">{{ pendingTasksCount }}项</text>
      </view>

      <view
        v-for="(task, index) in tasks"
        :key="index"
        class="task-item"
        :class="{ completed: task.completed }"
        @click="handleTaskClick(task)"
      >
        <view class="task-icon">
          <text v-if="task.completed" class="icon-check">✓</text>
          <text v-else class="icon-empty">○</text>
        </view>
        <view class="task-content">
          <text class="task-name">{{ task.name }}</text>
          <text v-if="task.description" class="task-desc">{{ task.description }}</text>
        </view>
        <text class="task-arrow">›</text>
      </view>

      <view v-if="tasks.length === 0" class="empty-state">
        <text class="empty-text">暂无任务</text>
      </view>
    </view>

    <!-- 提交审核按钮 -->
    <view v-if="canSubmit" class="submit-section">
      <button class="submit-btn" @click="handleSubmit">提交审核</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { patientAPI } from '../../api/patient';

const patientInfo = ref<any>({});
const currentStage = ref('V1');
const stageCompletion = ref<any>({});

// 所有任务
const tasks = computed(() => {
  const completion = stageCompletion.value;
  if (!completion.requirements) return [];

  const taskList: any[] = [];

  // 量表任务
  if (completion.requirements.requiredScales) {
    completion.requirements.requiredScales.forEach((scaleCode: string) => {
      const completed = completion.completedRequirements?.some(
        (r: any) => r.type === 'scale' && r.code === scaleCode
      );
      taskList.push({
        type: 'scale',
        code: scaleCode,
        name: `填写${scaleCode}量表`,
        description: '完成量表填写',
        completed,
        route: `/pages/scale/fill?code=${scaleCode}&stage=${currentStage.value}`,
      });
    });
  }

  // 病历文件
  if (completion.requirements.requiresMedicalFiles) {
    const completed = completion.completedRequirements?.some((r: any) => r.type === 'medical_file');
    taskList.push({
      type: 'medical_file',
      name: '上传病历文件',
      description: '至少上传1个病历文件',
      completed,
      route: '/pages/medical-file/upload',
    });
  }

  // 用药记录
  if (completion.requirements.requiresMedicationRecord) {
    const completed = completion.completedRequirements?.some((r: any) => r.type === 'medication_record');
    taskList.push({
      type: 'medication_record',
      name: '填写用药记录',
      description: '记录莱博雷生用药情况',
      completed,
      route: '/pages/medication/add',
    });
  }

  // 合并用药
  if (completion.requirements.requiresConcomitantMedication) {
    const completed = completion.completedRequirements?.some((r: any) => r.type === 'concomitant_medication');
    taskList.push({
      type: 'concomitant_medication',
      name: '填写合并用药',
      description: '记录其他药物使用情况',
      completed,
      route: '/pages/medication/add',
    });
  }

  return taskList;
});

// 待完成任务数
const pendingTasksCount = computed(() => {
  return tasks.value.filter((t) => !t.completed).length;
});

// 完成百分比
const completionPercent = computed(() => {
  if (tasks.value.length === 0) return 0;
  const completedCount = tasks.value.filter((t) => t.completed).length;
  return Math.round((completedCount / tasks.value.length) * 100);
});

// 是否可以提交
const canSubmit = computed(() => {
  return stageCompletion.value.canComplete === true;
});

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getMyInfo();
    patientInfo.value = result;
    currentStage.value = result.currentStage || 'V1';

    // 加载阶段完成状态
    await loadStageCompletion();
  } catch (error: any) {
    uni.showToast({
      title: '加载患者信息失败',
      icon: 'none',
    });
  }
};

// 加载阶段完成状态
const loadStageCompletion = async () => {
  try {
    const result = await patientAPI.getStageCompletionStatus(patientInfo.value.id);
    stageCompletion.value = result;
  } catch (error: any) {
    console.error('加载阶段完成状态失败:', error);
  }
};

// 任务点击
const handleTaskClick = (task: any) => {
  if (task.completed) {
    uni.showToast({
      title: '该任务已完成',
      icon: 'success',
      duration: 1500,
    });
    return;
  }

  if (task.route) {
    uni.navigateTo({
      url: task.route,
    });
  }
};

// 提交审核
const handleSubmit = () => {
  uni.showModal({
    title: '提示',
    content: '确认提交当前阶段资料进行审核吗?',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 调用完成阶段接口
          const stage = currentStage.value;
          await patientAPI[`complete${stage}`](patientInfo.value.id, {});

          uni.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1500,
          });

          // 重新加载数据
          setTimeout(() => {
            loadPatientInfo();
          }, 1500);
        } catch (error: any) {
          uni.showToast({
            title: error.message || '提交失败',
            icon: 'none',
          });
        }
      }
    },
  });
};

onMounted(() => {
  loadPatientInfo();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

/* 患者信息卡片 */
.patient-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  color: #ffffff;
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.patient-name {
  font-size: 36rpx;
  font-weight: bold;
}

.patient-code {
  font-size: 24rpx;
  opacity: 0.8;
}

.stage-badge {
  padding: 10rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.patient-detail {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.detail-item {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 阶段进度 */
.stage-progress {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.progress-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.progress-percent {
  font-size: 32rpx;
  font-weight: bold;
  color: #409EFF;
}

.progress-bar {
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

/* 任务列表 */
.task-list {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.task-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.task-count {
  font-size: 24rpx;
  color: #999999;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed {
  opacity: 0.6;
}

.task-icon {
  margin-right: 20rpx;
  font-size: 36rpx;
}

.icon-check {
  color: #52c41a;
}

.icon-empty {
  color: #d9d9d9;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.task-name {
  font-size: 28rpx;
  color: #333333;
}

.task-desc {
  font-size: 24rpx;
  color: #999999;
}

.task-arrow {
  font-size: 40rpx;
  color: #d9d9d9;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

/* 提交按钮 */
.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
