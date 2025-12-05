<template>
  <view class="home-container">
    <!-- 医生端 -->
    <view v-if="userRole === 'doctor'" class="doctor-home">
      <view class="doctor-header">
        <text class="welcome-text">欢迎，{{ userName }}医生</text>
        <text class="subtitle">睡眠跟踪系统 - 医生端</text>
      </view>

      <view class="quick-actions">
        <view class="action-item" @click="navigateTo('/pages/doctor/index')">
          <view class="action-icon">👥</view>
          <text class="action-text">患者管理</text>
        </view>
        <view class="action-item" @click="navigateTo('/pages/doctor/pending-review')">
          <view class="action-icon">📋</view>
          <text class="action-text">待审核</text>
        </view>
        <view class="action-item" @click="navigateTo('/pages/doctor/fill-scale')">
          <view class="action-icon">📊</view>
          <text class="action-text">填写量表</text>
        </view>
      </view>

      <view class="info-card">
        <text class="info-title">功能说明</text>
        <view class="info-content">
          <text class="info-item">• 查看和管理您的患者</text>
          <text class="info-item">• 审核患者提交的资料</text>
          <text class="info-item">• 查看患者量表记录</text>
          <text class="info-item">• 填写医生代填量表(HAMA/HAMD)</text>
        </view>
      </view>
    </view>

    <!-- 患者端 -->
    <view v-else-if="userRole === 'patient'" class="patient-home">
      <!-- 患者信息卡片 -->
      <view class="patient-card">
        <view class="patient-header">
          <view class="patient-info">
            <text class="patient-name">{{ patientInfo.user?.name || '患者' }}</text>
            <text class="patient-code">编号: {{ patientInfo.patientNo }}</text>
          </view>
          <view class="stage-badge" :class="'stage-' + currentStage.toLowerCase()">
            {{ currentStage }}
          </view>
        </view>
        <view class="patient-detail">
          <text class="detail-item">医院: {{ patientInfo.hospital?.name }}</text>
          <text class="detail-item">医生: {{ patientInfo.doctor?.user?.name || '未分配' }}</text>
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
    <!-- 患者端结束 -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { patientAPI } from '../../api/patient';
import config from '@/config';

// 用户信息
const userRole = ref<'patient' | 'doctor' | ''>('');
const userName = ref('');

// 患者端数据
const patientInfo = ref<any>({});
const currentStage = ref('V1');
const stageCompletion = ref<any>({});

// 页面跳转
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 所有任务
const tasks = computed(() => {
  const completion = stageCompletion.value;
  if (!completion.requirements) return [];

  const taskList: any[] = [];

  // 病历文件由医生端上传,患者端不显示此任务

  // 1. 用药记录 (第一位) - 莱博雷生
  if (completion.requirements.requiresMedicationRecord) {
    const completed = completion.completedRequirements?.some((r: any) => r.type === 'medicationRecord');
    taskList.push({
      type: 'medicationRecord',
      name: '填写用药记录',
      description: '记录莱博雷生用药情况',
      completed,
      route: '/pages/medication/add?type=record',
      priority: 1,
    });
  }

  // 2. 合并用药 (第二位)
  if (completion.requirements.requiresConcomitantMedication) {
    const completed = completion.completedRequirements?.some((r: any) => r.type === 'concomitantMedication');
    taskList.push({
      type: 'concomitantMedication',
      name: '填写合并用药',
      description: '记录其他药物使用情况',
      completed,
      route: '/pages/medication/add?type=concomitant',
      priority: 1,
    });
  }

  // 3. 量表任务 (第三位)
  if (completion.requirements.requiredScales) {
    completion.requirements.requiredScales.forEach((scaleCode: string) => {
      // 过滤掉医生代填的量表(HAMA和HAMD)
      if (scaleCode === 'HAMA' || scaleCode === 'HAMD') {
        return;
      }

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
        priority: 2,
      });
    });
  }

  // 排序: 先按完成状态(未完成在前),再按优先级
  return taskList.sort((a, b) => {
    // 未完成的排在前面
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 相同完成状态下,按优先级排序
    return a.priority - b.priority;
  });
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

// 初始化用户角色
const initUserRole = () => {
  const userInfo = uni.getStorageSync(config.userInfoKey);
  if (userInfo) {
    userRole.value = userInfo.role || 'patient';
    userName.value = userInfo.name || '用户';
  }
};

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getMyInfo();
    patientInfo.value = result;
    currentStage.value = result.currentStage || 'V1';

    // 加载阶段完成状态
    await loadStageCompletion();
  } catch (error: any) {
    console.error('加载患者信息失败:', error);
    uni.showToast({
      title: '加载患者信息失败',
      icon: 'none',
    });
  }
};

// 加载阶段完成状态
const loadStageCompletion = async () => {
  // 如果没有患者ID，不调用API
  if (!patientInfo.value.id) {
    console.warn('患者ID不存在，跳过加载阶段完成状态');
    return;
  }
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
  console.log('===== 首页 onMounted 开始 =====');
  const storageUserInfo = uni.getStorageSync(config.userInfoKey);
  console.log('localStorage 中的用户信息:', storageUserInfo);

  initUserRole();
  console.log('initUserRole 后，userRole.value =', userRole.value);

  // 只有患者端才加载患者信息
  if (userRole.value === 'patient') {
    loadPatientInfo();
  }

  console.log('===== 首页 onMounted 结束 =====');
});

// 每次页面显示时刷新数据
onShow(() => {
  initUserRole();

  // 只有患者端才刷新阶段完成状态
  if (userRole.value === 'patient' && patientInfo.value.id) {
    loadStageCompletion();
  }
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

/* 医生端样式 */
.doctor-home {
  width: 100%;
}

.doctor-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  color: #ffffff;
}

.welcome-text {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.action-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.action-icon {
  font-size: 60rpx;
}

.action-text {
  font-size: 26rpx;
  color: #333333;
}

.info-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.info-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 25rpx;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-item {
  font-size: 28rpx;
  color: #666666;
  line-height: 40rpx;
}

/* 患者端样式 */
.patient-home {
  width: 100%;
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
