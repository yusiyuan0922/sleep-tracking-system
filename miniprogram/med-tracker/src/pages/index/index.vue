<template>
  <view class="home-container">
    <!-- 引入空状态组件 -->
    <Empty
      v-if="showEmpty"
      type="task"
      title="暂无待办任务"
      description="当前阶段所有任务已完成，请等待医生审核或进入下一阶段"
      :padding-top="'200rpx'"
    />

    <!-- 医生端 -->
    <view v-if="userRole === 'doctor'" class="doctor-home">
      <view class="doctor-header">
        <view class="header-top">
          <view class="header-left">
            <text class="welcome-text">欢迎，{{ userName }}医生</text>
            <text class="subtitle">睡眠跟踪系统 - 医生端</text>
          </view>
          <!-- 医生端消息入口 -->
          <view class="doctor-message-btn" @click="goToMessageCenter">
            <text class="doctor-message-icon">🔔</text>
            <view v-if="unreadCount > 0" class="doctor-unread-badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </view>
          </view>
        </view>
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
        <view class="action-item" @click="goToMessageCenter">
          <view class="action-icon-wrapper">
            <text class="action-icon">📨</text>
            <view v-if="unreadCount > 0" class="action-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</view>
          </view>
          <text class="action-text">消息中心</text>
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
      <!-- 快捷入口 - 并排双卡片 -->
      <view class="quick-entry-row">
        <!-- 消息中心入口 -->
        <view class="quick-entry-card message-card" @click="goToMessageCenter">
          <view class="entry-icon-wrapper">
            <text class="entry-icon">🔔</text>
            <view v-if="unreadCount > 0" class="entry-badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </view>
          </view>
          <text class="entry-title">消息中心</text>
          <text class="entry-desc">{{ unreadCount > 0 ? `${unreadCount}条未读` : '系统通知' }}</text>
        </view>

        <!-- 不良事件上报入口 -->
        <view class="quick-entry-card adverse-card" @click="goToAdverseEvent">
          <view class="entry-icon-wrapper">
            <text class="entry-icon">⚠️</text>
          </view>
          <text class="entry-title">不良事件</text>
          <text class="entry-desc">及时上报</text>
        </view>
      </view>

      <!-- 患者信息卡片 -->
      <view class="patient-card">
        <view class="patient-header">
          <view class="patient-info">
            <text class="patient-name">{{ patientInfo.user?.name || '患者' }}</text>
            <text class="patient-code">编号: {{ patientInfo.patientNo }}</text>
          </view>
          <view class="stage-badge" :class="'stage-' + currentStage.toLowerCase()">
            {{ displayStage }}
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

        <!-- 使用 Empty 组件替代简单的空状态文字 -->
        <Empty
          v-if="tasks.length === 0"
          type="task"
          icon="🎉"
          title="所有任务已完成"
          description="当前阶段任务已全部完成，做得很好！"
          :padding-top="'40rpx'"
        />
      </view>

      <!-- 等待审核中提示 -->
      <view v-if="patientInfo.pendingReview" class="submit-section">
        <view class="pending-review-tip">
          <text class="pending-icon">⏳</text>
          <text class="pending-text">已提交审核，请等待医生审核</text>
        </view>
      </view>

      <!-- 提交审核按钮 -->
      <view v-else-if="canSubmit" class="submit-section">
        <button class="submit-btn" @click="handleSubmit">提交审核</button>
      </view>
    </view>
    <!-- 患者端结束 -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { patientAPI } from '../../api/patient';
import { getUnreadCount } from '../../api/message';
import { getStageDisplayName } from '../../utils/stage';
import config from '@/config';
import Empty from '@/components/common/Empty.vue';

// 空状态显示控制 - 当没有用户角色时显示
const showEmpty = computed(() => {
  return !userRole.value;
});

// 用户信息
const userRole = ref<'patient' | 'doctor' | ''>('');
const userName = ref('');

// 患者端数据
const patientInfo = ref<any>({});
const currentStage = ref('V1');

// 显示用的阶段名称
const displayStage = computed(() => {
  return getStageDisplayName(currentStage.value);
});
const stageCompletion = ref<any>({});
const unreadCount = ref(0);

// 页面跳转
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 跳转到不良事件页面
const goToAdverseEvent = () => {
  uni.navigateTo({ url: '/pages/adverse-event/list' });
};

// 跳转到消息中心
const goToMessageCenter = () => {
  uni.navigateTo({ url: '/pages/message/list' });
};

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCount();
    // 返回格式可能是 { count: number } 或直接是 number
    unreadCount.value = typeof res === 'number' ? res : (res?.count || 0);
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    unreadCount.value = 0;
  }
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

  // 2. 合并用药已移除 - 不属于必填项，不影响阶段推进
  // 合并用药在用药tabbar中可随时填写，不作为待完成任务显示

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
  console.log('initUserRole - userInfo:', userInfo);
  console.log('initUserRole - userInfo.role:', userInfo?.role);
  if (userInfo) {
    userRole.value = userInfo.role || 'patient';
    userName.value = userInfo.name || '用户';
  }
  console.log('initUserRole - 最终 userRole.value:', userRole.value);
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
          // 调用患者提交审核接口（只设置pendingReview，等待医生审核）
          await patientAPI.submitForReview(patientInfo.value.id);

          uni.showToast({
            title: '提交成功，请等待医生审核',
            icon: 'success',
            duration: 2000,
          });

          // 重新加载数据
          setTimeout(() => {
            loadPatientInfo();
          }, 2000);
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

// 跳转到医生首页
const redirectToDoctor = () => {
  console.log('执行跳转到医生端首页...');
  uni.reLaunch({
    url: '/pages/doctor/home',
    success: () => {
      console.log('跳转到医生首页成功');
    },
    fail: (err) => {
      console.error('跳转到医生首页失败:', err);
    }
  });
};

onMounted(() => {
  console.log('===== 首页 onMounted 开始 =====');
  const storageUserInfo = uni.getStorageSync(config.userInfoKey);
  console.log('localStorage 中的用户信息:', storageUserInfo);

  initUserRole();
  console.log('initUserRole 后，userRole.value =', userRole.value);

  // 如果是医生，延迟跳转到医生首页，避免和其他操作冲突
  if (userRole.value === 'doctor') {
    console.log('检测到医生角色，准备跳转...');
    setTimeout(() => {
      redirectToDoctor();
    }, 50);
    return;
  }

  // 加载未读消息数量
  loadUnreadCount();

  // 患者端加载患者信息
  if (userRole.value === 'patient') {
    loadPatientInfo();
  }

  console.log('===== 首页 onMounted 结束 =====');
});

// 每次页面显示时刷新数据
onShow(() => {
  initUserRole();

  // 如果是医生，延迟跳转到医生首页
  if (userRole.value === 'doctor') {
    console.log('onShow: 检测到医生角色，准备跳转...');
    setTimeout(() => {
      redirectToDoctor();
    }, 50);
    return;
  }

  // 刷新未读消息数量
  loadUnreadCount();

  // 只有患者端才刷新阶段完成状态
  if (userRole.value === 'patient') {
    if (patientInfo.value.id) {
      loadStageCompletion();
    }
  }
});

// 监听消息已读事件，刷新未读数
uni.$on('message-read', () => {
  loadUnreadCount();
});

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    // 刷新未读消息数量
    await loadUnreadCount();

    // 患者端刷新患者信息和阶段状态
    if (userRole.value === 'patient') {
      await loadPatientInfo();
    }

    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1000,
    });
  } catch (error) {
    console.error('下拉刷新失败:', error);
  } finally {
    uni.stopPullDownRefresh();
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.doctor-message-btn {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-message-icon {
  font-size: 40rpx;
}

.doctor-unread-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 36rpx;
  height: 36rpx;
  background-color: #ff4d4f;
  border-radius: 18rpx;
  font-size: 22rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-weight: bold;
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
  grid-template-columns: repeat(4, 1fr);
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
  transition: all 0.15s ease;
}

.action-item:active {
  opacity: 0.8;
  transform: scale(0.96);
}

.action-icon {
  font-size: 60rpx;
}

.action-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-badge {
  position: absolute;
  top: -10rpx;
  right: -16rpx;
  min-width: 32rpx;
  height: 32rpx;
  background-color: #ff4d4f;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  font-weight: bold;
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
  transition: all 0.15s ease;
}

.task-item:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.task-item:last-child {
  border-bottom: none;
}

/* 已完成任务 - 使用绿色主题而非降低透明度 */
.task-item.completed {
  background-color: #f6ffed;
  border-radius: 12rpx;
  margin: 0 -20rpx;
  padding: 25rpx 20rpx;
  border-bottom: none;
}

.task-item.completed + .task-item {
  border-top: none;
}

.task-item.completed .task-name {
  color: #52c41a;
}

.task-item.completed .task-desc {
  color: #95de64;
}

.task-item.completed .task-arrow {
  color: #52c41a;
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

/* 快捷入口 - 并排双卡片 */
.quick-entry-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.quick-entry-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx 20rpx;
  border-radius: 20rpx;
  transition: all 0.15s ease;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.quick-entry-card:active {
  opacity: 0.85;
  transform: scale(0.96);
}

/* 消息中心卡片 */
.message-card {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border: 2rpx solid #91d5ff;
}

.message-card .entry-title {
  color: #096dd9;
}

.message-card .entry-desc {
  color: #1890ff;
}

/* 不良事件卡片 */
.adverse-card {
  background: linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%);
  border: 2rpx solid #ffd666;
}

.adverse-card .entry-title {
  color: #d48806;
}

.adverse-card .entry-desc {
  color: #ad6800;
}

/* 入口图标 */
.entry-icon-wrapper {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.entry-icon {
  font-size: 56rpx;
}

/* 未读徽章 */
.entry-badge {
  position: absolute;
  top: -4rpx;
  right: -8rpx;
  min-width: 36rpx;
  height: 36rpx;
  background-color: #ff4d4f;
  border-radius: 18rpx;
  font-size: 20rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-weight: bold;
  box-shadow: 0 2rpx 6rpx rgba(255, 77, 79, 0.4);
}

/* 入口标题 */
.entry-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 6rpx;
}

/* 入口描述 */
.entry-desc {
  font-size: 22rpx;
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

/* 等待审核提示 */
.pending-review-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 16rpx;
}

.pending-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.pending-text {
  font-size: 30rpx;
  color: #d48806;
  font-weight: 500;
}
</style>
