<template>
  <view class="patient-detail-container">
    <!-- 患者信息卡片 -->
    <view class="patient-header-card">
      <view class="patient-avatar">
        <text>{{ patientInfo.user?.name?.charAt(0) || '患' }}</text>
      </view>
      <view class="patient-info">
        <view class="name-row">
          <text class="patient-name">{{ patientInfo.user?.name || '患者' }}</text>
          <view class="stage-badge" :class="'stage-' + patientInfo.currentStage?.toLowerCase()">
            {{ patientInfo.currentStage }}
          </view>
        </view>
        <text class="patient-code">编号: {{ patientInfo.patientNo }}</text>
        <text class="patient-meta">{{ patientInfo.user?.gender === 'male' ? '男' : '女' }} | {{ patientInfo.user?.birthDate }}</text>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs-section">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="changeTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 基本信息标签 -->
    <view v-if="currentTab === 'info'" class="tab-content">
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">联系电话</text>
            <text class="info-value">{{ patientInfo.user?.phone || '未设置' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">入组日期</text>
            <text class="info-value">{{ patientInfo.enrollmentDate }}</text>
          </view>
          <view v-if="patientInfo.emergencyContact" class="info-item">
            <text class="info-label">紧急联系人</text>
            <text class="info-value">{{ patientInfo.emergencyContact }} ({{ patientInfo.emergencyPhone }})</text>
          </view>
          <view v-if="patientInfo.diagnosis" class="info-item vertical">
            <text class="info-label">诊断信息</text>
            <text class="info-value">{{ patientInfo.diagnosis }}</text>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">阶段进度</view>
        <view class="stage-timeline">
          <view
            v-for="stage in stageProgress"
            :key="stage.name"
            class="stage-item"
            :class="{ completed: stage.completed, current: stage.current }"
          >
            <view class="stage-marker">
              <text v-if="stage.completed" class="marker-icon">✓</text>
              <text v-else class="marker-dot"></text>
            </view>
            <view class="stage-content">
              <text class="stage-name">{{ stage.name }}</text>
              <text v-if="stage.completedAt" class="stage-time">{{ stage.completedAt }}</text>
              <text v-else-if="stage.current" class="stage-status">进行中</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 量表记录标签 -->
    <view v-if="currentTab === 'scales'" class="tab-content">
      <view
        v-for="record in scaleRecords"
        :key="record.id"
        class="scale-record-card"
      >
        <view class="record-header">
          <text class="scale-name">{{ record.scaleCode }}</text>
          <view class="record-score">得分: {{ record.totalScore }}</view>
        </view>
        <view class="record-info">
          <text class="info-text">阶段: {{ record.stage }}</text>
          <text class="info-text">时间: {{ record.createdAt }}</text>
        </view>
      </view>

      <view v-if="scaleRecords.length === 0" class="empty-state">
        <text class="empty-text">暂无量表记录</text>
      </view>
    </view>

    <!-- 用药记录标签 -->
    <view v-if="currentTab === 'medications'" class="tab-content">
      <view
        v-for="med in medications"
        :key="med.id"
        class="medication-card"
      >
        <view class="med-header">
          <text class="med-name">{{ med.medicationName }}</text>
          <view class="stage-tag">{{ med.stage }}</view>
        </view>
        <view class="med-info">
          <text class="info-text">剂量: {{ med.dosage }}mg</text>
          <text class="info-text">频率: {{ med.frequency }}</text>
        </view>
        <view class="med-info">
          <text class="info-text">{{ med.startDate }} ~ {{ med.endDate || '持续用药' }}</text>
        </view>
      </view>

      <view v-if="medications.length === 0" class="empty-state">
        <text class="empty-text">暂无用药记录</text>
      </view>
    </view>

    <!-- 不良事件标签 -->
    <view v-if="currentTab === 'adverse-events'" class="tab-content">
      <view
        v-for="event in adverseEvents"
        :key="event.id"
        class="event-card"
      >
        <view class="event-header">
          <text class="event-name">{{ event.eventName }}</text>
          <view class="severity-tag" :class="'severity-' + event.severity">
            {{ severityLabels[event.severity] }}
          </view>
        </view>
        <view class="event-info">
          <text class="info-text">发生时间: {{ event.occurredAt }}</text>
        </view>
        <view class="event-info">
          <text class="info-text">关系: {{ relationshipLabels[event.relationship] }}</text>
        </view>
      </view>

      <view v-if="adverseEvents.length === 0" class="empty-state">
        <text class="empty-text">暂无不良事件记录</text>
      </view>
    </view>

    <!-- 操作按钮区 -->
    <view class="action-section">
      <button class="action-btn primary" @click="goToFillScale">
        代填量表
      </button>
      <button v-if="canReview" class="action-btn success" @click="handleReview">
        审核{{ patientInfo.currentStage }}阶段
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { patientAPI } from '../../api/patient';
import { scaleAPI } from '../../api/scale';
import { medicationAPI } from '../../api/medication';
import { adverseEventAPI } from '../../api/adverse-event';

const patientId = ref(0);
const patientInfo = ref<any>({});
const currentTab = ref('info');
const scaleRecords = ref<any[]>([]);
const medications = ref<any[]>([]);
const adverseEvents = ref<any[]>([]);

const tabs = [
  { value: 'info', label: '基本信息' },
  { value: 'scales', label: '量表记录' },
  { value: 'medications', label: '用药记录' },
  { value: 'adverse-events', label: '不良事件' },
];

const severityLabels: any = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const relationshipLabels: any = {
  definitely_related: '肯定相关',
  probably_related: '可能相关',
  possibly_related: '可疑相关',
  unlikely_related: '可能无关',
  not_related: '肯定无关',
};

// 阶段进度
const stageProgress = computed(() => {
  const stages = ['V1', 'V2', 'V3', 'V4'];
  const currentStage = patientInfo.value.currentStage;

  return stages.map((stage) => {
    const completedAtKey = `${stage.toLowerCase()}CompletedAt`;
    const completedAt = patientInfo.value[completedAtKey];

    return {
      name: stage,
      completed: !!completedAt,
      current: stage === currentStage,
      completedAt: completedAt,
    };
  });
});

// 是否可以审核
const canReview = computed(() => {
  return patientInfo.value.pendingReview === true;
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

// 加载量表记录
const loadScaleRecords = async () => {
  try {
    const result = await scaleAPI.getRecords({
      patientId: patientId.value,
    });
    scaleRecords.value = result.list || result.items || result || [];
  } catch (error: any) {
    console.error('加载量表记录失败:', error);
  }
};

// 加载用药记录
const loadMedications = async () => {
  try {
    const result = await medicationAPI.getRecordList({
      patientId: patientId.value,
    });
    medications.value = result.list || result.items || result || [];
  } catch (error: any) {
    console.error('加载用药记录失败:', error);
  }
};

// 加载不良事件
const loadAdverseEvents = async () => {
  try {
    const result = await adverseEventAPI.getList({
      patientId: patientId.value,
    });
    adverseEvents.value = result.items || result || [];
  } catch (error: any) {
    console.error('加载不良事件失败:', error);
  }
};

// 切换标签
const changeTab = (tab: string) => {
  currentTab.value = tab;

  // 加载对应数据
  if (tab === 'scales' && scaleRecords.value.length === 0) {
    loadScaleRecords();
  } else if (tab === 'medications' && medications.value.length === 0) {
    loadMedications();
  } else if (tab === 'adverse-events' && adverseEvents.value.length === 0) {
    loadAdverseEvents();
  }
};

// 代填量表
const goToFillScale = () => {
  uni.showActionSheet({
    itemList: ['HAMA量表', 'HAMD量表'],
    success: (res) => {
      const scaleCode = res.tapIndex === 0 ? 'HAMA' : 'HAMD';
      uni.navigateTo({
        url: `/pages/doctor/fill-scale?patientId=${patientId.value}&scaleCode=${scaleCode}&stage=${patientInfo.value.currentStage}`,
      });
    },
  });
};

// 审核
const handleReview = () => {
  uni.navigateTo({
    url: `/pages/doctor/review?patientId=${patientId.value}&stage=${patientInfo.value.currentStage}`,
  });
};

onLoad((options: any) => {
  patientId.value = parseInt(options.id);
  loadPatientInfo();
});
</script>

<style scoped>
.patient-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 150rpx;
}

/* 患者头部卡片 */
.patient-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  display: flex;
  gap: 30rpx;
  align-items: center;
}

.patient-avatar {
  width: 120rpx;
  height: 120rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
}

.patient-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.stage-badge {
  padding: 6rpx 16rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #ffffff;
}

.patient-code,
.patient-meta {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 标签页 */
.tabs-section {
  display: flex;
  background-color: #ffffff;
  padding: 0 30rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666666;
  border-bottom: 4rpx solid transparent;
}

.tab-item.active {
  color: #667eea;
  font-weight: bold;
  border-bottom-color: #667eea;
}

/* 标签内容 */
.tab-content {
  padding: 30rpx;
}

.info-section {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item.vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 12rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999999;
}

.info-value {
  font-size: 26rpx;
  color: #333333;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
}

.info-item.vertical .info-value {
  text-align: left;
  line-height: 1.6;
}

/* 阶段时间轴 */
.stage-timeline {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.stage-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  position: relative;
}

.stage-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 24rpx;
  top: 50rpx;
  width: 2rpx;
  height: calc(100% + 30rpx);
  background-color: #e8e8e8;
}

.stage-item.completed:not(:last-child)::after {
  background-color: #52c41a;
}

.stage-marker {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.stage-item.completed .stage-marker {
  background-color: #52c41a;
}

.stage-item.current .stage-marker {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.marker-icon {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
}

.marker-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ffffff;
}

.stage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 8rpx;
}

.stage-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.stage-time {
  font-size: 24rpx;
  color: #999999;
}

.stage-status {
  font-size: 24rpx;
  color: #667eea;
}

/* 卡片样式 */
.scale-record-card,
.medication-card,
.event-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.record-header,
.med-header,
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.scale-name,
.med-name,
.event-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.record-score {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

.stage-tag {
  padding: 6rpx 16rpx;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.severity-tag {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.severity-mild {
  background-color: #e6fffb;
  color: #13c2c2;
}

.severity-moderate {
  background-color: #fff7e6;
  color: #fa8c16;
}

.severity-severe {
  background-color: #fff1f0;
  color: #f5222d;
}

.record-info,
.med-info,
.event-info {
  display: flex;
  gap: 30rpx;
  margin-bottom: 10rpx;
}

.info-text {
  font-size: 24rpx;
  color: #666666;
}

/* 空状态 */
.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
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

.action-btn.primary {
  background-color: #667eea;
  color: #ffffff;
}

.action-btn.success {
  background-color: #52c41a;
  color: #ffffff;
}
</style>
