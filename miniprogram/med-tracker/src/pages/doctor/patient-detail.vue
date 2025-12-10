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
            {{ getStageDisplayName(patientInfo.currentStage) }}
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
        class="scale-record-card clickable"
        @click="goToScaleDetail(record.id)"
      >
        <view class="record-header">
          <text class="scale-name">{{ record.scaleCode }}</text>
          <view class="record-score">得分: {{ record.totalScore }}</view>
        </view>
        <view class="record-info">
          <text class="info-text">阶段: {{ record.stage }}</text>
          <text class="info-text">时间: {{ formatDateTime(record.createdAt) }}</text>
        </view>
        <view class="record-arrow">
          <text>›</text>
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

    <!-- 病历文件标签 -->
    <view v-if="currentTab === 'medical-files'" class="tab-content">
      <view class="files-grid">
        <view
          v-for="file in medicalFiles"
          :key="file.id"
          class="file-card-grid"
          @click="previewFile(file)"
        >
          <!-- 图片类型显示缩略图 -->
          <view v-if="file.fileType === 'image'" class="file-thumbnail">
            <image :src="file.fileUrl" mode="aspectFill" class="thumbnail-image" />
          </view>
          <!-- 非图片类型显示图标 -->
          <view v-else class="file-icon-large">
            <text>{{ getFileIcon(file.fileType) }}</text>
          </view>
          <view class="file-info-grid">
            <text class="file-name-grid">{{ getDisplayFileName(file) }}</text>
            <text class="file-meta-grid">{{ file.stage }} | {{ formatFileSize(file.fileSize) }}</text>
          </view>
        </view>
      </view>

      <view v-if="medicalFiles.length === 0" class="empty-state">
        <text class="empty-text">暂无病历文件</text>
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

    <!-- 审核区域（待审核时显示） -->
    <view v-if="canReview" class="review-section">
      <view class="review-header">
        <text class="review-title">📋 {{ getStageDisplayName(patientInfo.currentStage) }}阶段审核</text>
        <view class="pending-badge">待审核</view>
      </view>

      <!-- 完成情况检查 -->
      <view class="completion-check">
        <text class="check-title">完成情况</text>
        <view class="requirement-list">
          <view
            v-for="req in requirements"
            :key="req.type + (req.code || '')"
            class="requirement-item"
            :class="{ completed: req.completed }"
          >
            <view class="req-icon">
              <text v-if="req.completed">✓</text>
              <text v-else>✗</text>
            </view>
            <text class="req-text">{{ req.name }}</text>
          </view>
        </view>

        <view v-if="!canApprove" class="warning-box">
          <text class="warning-icon">⚠️</text>
          <view class="warning-content">
            <text class="warning-text">该患者尚未完成所有必填项</text>
            <view v-if="incompleteItems.length > 0" class="incomplete-list">
              <text v-for="item in incompleteItems" :key="item" class="incomplete-item">• {{ item }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 审核意见 -->
      <view class="review-input">
        <text class="input-label">审核意见</text>
        <textarea
          class="review-textarea"
          v-model="reviewNotes"
          placeholder="请输入审核意见(驳回时必填)"
          placeholder-class="placeholder"
          maxlength="500"
        />
        <text class="char-count">{{ reviewNotes.length }}/500</text>
      </view>

      <!-- 审核按钮 -->
      <view class="review-actions">
        <button class="review-btn reject" @click="handleReject" :loading="submitting">
          驳回
        </button>
        <button class="review-btn approve" @click="handleApprove" :disabled="!canApprove" :loading="submitting">
          通过
        </button>
      </view>
    </view>

    <!-- 操作按钮区 -->
    <view class="action-section">
      <button class="action-btn primary" @click="goToFillScale">
        代填量表
      </button>
      <button class="action-btn secondary" @click="goToUploadFile">
        上传病历文件
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { patientAPI } from '../../api/patient';
import { scaleAPI } from '../../api/scale';
import { medicationAPI } from '../../api/medication';
import { adverseEventAPI } from '../../api/adverse-event';
import { medicalFileAPI } from '../../api/medical-file';
import { getStageDisplayName } from '../../utils/stage';

const patientId = ref(0);
const patientInfo = ref<any>({});
const currentTab = ref('info');
const scaleRecords = ref<any[]>([]);
const medications = ref<any[]>([]);
const adverseEvents = ref<any[]>([]);
const medicalFiles = ref<any[]>([]);
const completedDoctorScales = ref<string[]>([]); // 当前阶段已完成的医生量表

// 审核相关
const completionStatus = ref<any>({});
const reviewNotes = ref('');
const submitting = ref(false);

const tabs = [
  { value: 'info', label: '基本信息' },
  { value: 'scales', label: '量表记录' },
  { value: 'medications', label: '用药记录' },
  { value: 'medical-files', label: '病历文件' },
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

// 获取文件图标
const getFileIcon = (fileType: string) => {
  if (!fileType) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('doc')) return '📘';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📗';
  return '📄';
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes) return '未知大小';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 获取显示用的文件名
const getDisplayFileName = (file: any) => {
  // 如果文件名是OSS格式（UUID或无意义的字符串），生成友好的名称
  const fileName = file.fileName || '';
  // 判断是否是OSS格式的文件名（通常是UUID或特殊编码）
  if (!fileName || fileName.length > 50 || /^[a-f0-9-]{30,}/.test(fileName)) {
    // 根据文件类型生成友好名称
    const typeLabel = file.fileType === 'image' ? '病历图片' : '病历文件';
    const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleDateString('zh-CN') : '';
    return `${typeLabel}_${file.stage}${dateStr ? '_' + dateStr : ''}`;
  }
  return fileName;
};

// 预览文件
const previewFile = (file: any) => {
  if (!file.fileUrl) {
    uni.showToast({ title: '文件链接不存在', icon: 'none' });
    return;
  }

  // 图片类型直接预览
  if (file.fileType === 'image') {
    // 获取所有图片文件的URL用于预览时滑动
    const imageUrls = medicalFiles.value
      .filter((f: any) => f.fileType === 'image')
      .map((f: any) => f.fileUrl);
    uni.previewImage({
      urls: imageUrls.length > 0 ? imageUrls : [file.fileUrl],
      current: file.fileUrl,
    });
  } else {
    // 其他类型打开文档
    uni.downloadFile({
      url: file.fileUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            fail: () => {
              uni.showToast({ title: '无法打开此类型文件', icon: 'none' });
            },
          });
        }
      },
      fail: () => {
        uni.showToast({ title: '下载文件失败', icon: 'none' });
      },
    });
  }
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

// 是否显示审核区域（只有当患者完成所有必填项后才显示审核区域）
const canReview = computed(() => {
  // 只有当 canComplete 为 true 时才显示审核区域
  // 即患者已完成当前阶段所有必填项，等待医生审核
  return completionStatus.value.canComplete === true &&
         patientInfo.value.currentStage !== 'completed';
});

// 必填项列表
const requirements = computed(() => {
  const reqs = completionStatus.value.requirements || {};
  const completed = completionStatus.value.completedRequirements || [];

  const list: any[] = [];

  // 量表
  if (reqs.requiredScales) {
    reqs.requiredScales.forEach((code: string) => {
      const isCompleted = completed.some((r: any) => r.type === 'scale' && r.code === code);
      list.push({
        type: 'scale',
        code,
        name: `${code}量表`,
        completed: isCompleted,
      });
    });
  }

  // 用药记录
  if (reqs.requiresMedicationRecord) {
    const isCompleted = completed.some((r: any) => r.type === 'medicationRecord');
    list.push({
      type: 'medicationRecord',
      name: '用药记录',
      completed: isCompleted,
    });
  }

  return list;
});

// 是否可以通过审核
const canApprove = computed(() => {
  return completionStatus.value.canComplete === true;
});

// 未完成项目列表
const incompleteItems = computed(() => {
  const backendMissing = completionStatus.value.missingRequirements || [];
  if (backendMissing.length > 0) {
    return backendMissing.map((r: any) => r.name || r.message || `${r.code}量表`);
  }
  return requirements.value
    .filter((req) => !req.completed)
    .map((req) => req.name);
});

// 加载患者信息
const loadPatientInfo = async () => {
  try {
    const result = await patientAPI.getDetail(patientId.value);
    patientInfo.value = result;
    // 加载已完成的医生量表
    await loadCompletedDoctorScales();
    // 对于非completed状态的患者，加载完成状态来判断是否可以审核
    if (result.currentStage !== 'completed') {
      await loadCompletionStatus();
    }
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
};

// 加载完成状态
const loadCompletionStatus = async () => {
  try {
    const result = await patientAPI.getStageCompletionStatus(patientId.value);
    completionStatus.value = result;
  } catch (error: any) {
    console.error('加载完成状态失败:', error);
  }
};

// 加载当前阶段已完成的医生量表
const loadCompletedDoctorScales = async () => {
  try {
    const stage = patientInfo.value.currentStage;
    if (!stage || (stage !== 'V1' && stage !== 'V3')) {
      completedDoctorScales.value = [];
      return;
    }

    const records = await scaleAPI.getPatientStageRecords(patientId.value, stage);
    const completed = (records || [])
      .map((r: any) => r.scale?.code || r.scaleCode)
      .filter((code: string) => code === 'HAMA' || code === 'HAMD');
    completedDoctorScales.value = completed;
  } catch (error) {
    console.error('加载已完成医生量表失败:', error);
    completedDoctorScales.value = [];
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

// 加载病历文件
const loadMedicalFiles = async () => {
  try {
    const result = await medicalFileAPI.getList({
      patientId: patientId.value,
    });
    // 后端返回 { data: [...], total, page, pageSize, totalPages }
    medicalFiles.value = result.data || result.items || result || [];
  } catch (error: any) {
    console.error('加载病历文件失败:', error);
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
  } else if (tab === 'medical-files' && medicalFiles.value.length === 0) {
    loadMedicalFiles();
  }
};

// 代填量表
const goToFillScale = () => {
  const stage = patientInfo.value.currentStage;

  // 检查是否是需要医生代填量表的阶段
  if (stage !== 'V1' && stage !== 'V3') {
    uni.showToast({ title: '当前阶段不需要医生代填量表', icon: 'none' });
    return;
  }

  // 构建可选量表列表（排除已完成的）
  const allScales = [
    { code: 'HAMA', name: 'HAMA量表' },
    { code: 'HAMD', name: 'HAMD量表' },
  ];

  const availableScales = allScales.filter(
    s => !completedDoctorScales.value.includes(s.code)
  );

  if (availableScales.length === 0) {
    uni.showToast({ title: '医生量表已全部完成', icon: 'none' });
    return;
  }

  uni.showActionSheet({
    itemList: availableScales.map(s => s.name),
    success: (res) => {
      const selectedScale = availableScales[res.tapIndex];
      uni.navigateTo({
        url: `/pages/doctor/fill-scale?patientId=${patientId.value}&scaleCode=${selectedScale.code}&stage=${stage}`,
      });
    },
  });
};

// 上传病历文件
const goToUploadFile = () => {
  uni.navigateTo({
    url: `/pages/medical-file/upload?patientId=${patientId.value}&stage=${patientInfo.value.currentStage}`,
  });
};

// 查看量表记录详情
const goToScaleDetail = (recordId: number) => {
  uni.navigateTo({
    url: `/pages/scale/detail?id=${recordId}`,
  });
};

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 通过审核
const handleApprove = () => {
  const stageName = getStageDisplayName(patientInfo.value.currentStage);
  uni.showModal({
    title: '确认通过',
    content: `确认通过${stageName}阶段的审核吗?`,
    success: async (res) => {
      if (res.confirm) {
        await submitReview('approved');
      }
    },
  });
};

// 驳回审核
const handleReject = () => {
  if (!reviewNotes.value) {
    uni.showToast({
      title: '驳回时必须填写审核意见',
      icon: 'none',
    });
    return;
  }

  const stageName = getStageDisplayName(patientInfo.value.currentStage);
  uni.showModal({
    title: '确认驳回',
    content: `确认驳回${stageName}阶段吗?`,
    confirmText: '确认驳回',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        await submitReview('rejected');
      }
    },
  });
};

// 提交审核
const submitReview = async (decision: 'approved' | 'rejected') => {
  try {
    submitting.value = true;
    const stage = patientInfo.value.currentStage;

    // 调用完成阶段API
    const methodName = `complete${stage}` as keyof typeof patientAPI;
    await (patientAPI[methodName] as Function)(patientId.value, {
      reviewDecision: decision,
      reviewNotes: reviewNotes.value,
    });

    uni.showToast({
      title: decision === 'approved' ? '审核通过' : '已驳回',
      icon: 'success',
      duration: 1500,
    });

    // 刷新页面数据
    setTimeout(() => {
      reviewNotes.value = '';
      completionStatus.value = {};
      loadPatientInfo();
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};

onLoad((options: any) => {
  patientId.value = parseInt(options.id);
  loadPatientInfo();
});

// 页面显示时刷新已完成量表状态（从填写页面返回时）
onShow(() => {
  if (patientId.value && patientInfo.value.currentStage) {
    loadCompletedDoctorScales();
  }
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
.event-card,
.file-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.scale-record-card.clickable {
  position: relative;
  padding-right: 60rpx;
}

.scale-record-card.clickable:active {
  background-color: #f5f5f5;
}

.record-arrow {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40rpx;
  color: #cccccc;
}

/* 病历文件卡片 */
.file-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.file-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #f0f5ff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.file-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 24rpx;
  color: #999999;
}

.file-time {
  font-size: 22rpx;
  color: #cccccc;
}

.file-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

/* 病历文件网格布局 */
.files-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.file-card-grid {
  width: calc(50% - 10rpx);
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.file-thumbnail {
  width: 100%;
  height: 200rpx;
  background-color: #f5f5f5;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.file-icon-large {
  width: 100%;
  height: 200rpx;
  background-color: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
}

.file-info-grid {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.file-name-grid {
  font-size: 26rpx;
  font-weight: 500;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta-grid {
  font-size: 22rpx;
  color: #999999;
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

.action-btn.secondary {
  background-color: #fa8c16;
  color: #ffffff;
}

.action-btn.success {
  background-color: #52c41a;
  color: #ffffff;
}

/* 审核区域样式 */
.review-section {
  margin: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  border: 2rpx solid #fa8c16;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.review-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.pending-badge {
  padding: 8rpx 20rpx;
  background-color: #fff7e6;
  color: #fa8c16;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.completion-check {
  margin-bottom: 30rpx;
}

.check-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 15rpx 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
}

.requirement-item.completed {
  background-color: #e6fffb;
}

.req-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  background-color: #ff4d4f;
  color: #ffffff;
}

.requirement-item.completed .req-icon {
  background-color: #52c41a;
}

.req-text {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
  padding: 20rpx;
  background-color: #fff7e6;
  border-radius: 10rpx;
  border-left: 6rpx solid #fa8c16;
}

.warning-icon {
  font-size: 32rpx;
}

.warning-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.warning-text {
  font-size: 24rpx;
  color: #fa8c16;
  line-height: 1.5;
}

.incomplete-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.incomplete-item {
  font-size: 22rpx;
  color: #d46b08;
  padding-left: 10rpx;
}

.review-input {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 15rpx;
}

.review-textarea {
  width: 100%;
  min-height: 150rpx;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
  box-sizing: border-box;
}

.placeholder {
  color: #999999;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999999;
  margin-top: 10rpx;
}

.review-actions {
  display: flex;
  gap: 20rpx;
}

.review-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.review-btn.reject {
  background-color: #ff4d4f;
  color: #ffffff;
}

.review-btn.approve {
  background-color: #52c41a;
  color: #ffffff;
}

.review-btn[disabled] {
  opacity: 0.5;
}
</style>
