<template>
  <view class="medication-list-container">
    <!-- 添加按钮 -->
    <view class="add-section">
      <button class="add-btn" @click="goToAdd">
        <text class="add-icon">+</text>
        <text>添加合并用药</text>
      </button>
    </view>

    <!-- 合并用药列表 -->
    <view class="medication-list">
      <view
        v-for="record in records"
        :key="record.id"
        class="medication-item"
        @click="handleItemClick(record)"
      >
        <view class="medication-header">
          <text class="medication-name">{{ record.drugName }}</text>
          <view class="stage-tag">{{ record.stage }}</view>
        </view>
        <view class="medication-info">
          <text class="info-item">剂量: {{ record.dosage }}{{ record.unit }}</text>
          <text class="info-item">频率: {{ record.frequency }}</text>
        </view>
        <view class="medication-info">
          <text class="info-item">途径: {{ record.route }}</text>
          <text class="info-item">剂型: {{ record.specification }}</text>
        </view>
        <view class="medication-info">
          <text class="info-item">开始: {{ formatDate(record.startDate) }}</text>
          <text v-if="record.endDate" class="info-item">结束: {{ formatDate(record.endDate) }}</text>
          <text v-else class="info-item status-ongoing">持续用药</text>
        </view>
        <view v-if="record.indication" class="medication-notes">
          <text>适应症: {{ record.indication }}</text>
        </view>
        <view v-if="record.remark" class="medication-notes">
          <text>备注: {{ record.remark }}</text>
        </view>
      </view>

      <view v-if="(!records || records.length === 0) && !loading" class="empty-state">
        <text class="empty-icon">💊</text>
        <text class="empty-text">暂无合并用药记录</text>
        <text class="empty-hint">点击上方按钮添加</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { medicationAPI } from '../../api/medication';
import { patientAPI } from '../../api/patient';

const records = ref<any[]>([]);
const loading = ref(false);
const patientInfo = ref<any>({});

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 加载合并用药记录
const loadRecords = async () => {
  try {
    loading.value = true;

    // 获取患者信息
    const patient = await patientAPI.getMyInfo();
    patientInfo.value = patient;

    // 获取合并用药列表
    const result = await medicationAPI.getConcomitantList({
      patientId: patient.id,
    });

    // 后端返回格式: { data: [...], total, page, pageSize, totalPages }
    // 安全地提取数组数据
    if (result && Array.isArray(result.data)) {
      records.value = result.data;
    } else if (result && Array.isArray(result.items)) {
      records.value = result.items;
    } else if (Array.isArray(result)) {
      records.value = result;
    } else {
      records.value = [];
    }
  } catch (error: any) {
    console.error('加载合并用药失败:', error);
    records.value = [];
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 跳转到添加页面 (合并用药)
const goToAdd = () => {
  uni.navigateTo({
    url: '/pages/medication/add?type=concomitant',
  });
};

// 点击记录项 (查看详情)
const handleItemClick = (record: any) => {
  // 显示详情弹窗
  uni.showModal({
    title: record.drugName,
    content: `剂量: ${record.dosage}${record.unit}\n频率: ${record.frequency}\n途径: ${record.route}\n适应症: ${record.indication || '无'}\n开始日期: ${formatDate(record.startDate)}\n${record.endDate ? '结束日期: ' + formatDate(record.endDate) : '持续用药'}`,
    showCancel: false,
  });
};

onMounted(() => {
  loadRecords();
});

// 监听页面显示(从添加页面返回时刷新)
onShow(() => {
  loadRecords();
});

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await loadRecords();
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
.medication-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 添加按钮 */
.add-section {
  margin-bottom: 30rpx;
}

.add-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.add-icon {
  font-size: 36rpx;
}

/* 用药记录列表 */
.medication-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.medication-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.medication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.medication-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.stage-tag {
  padding: 6rpx 16rpx;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.medication-info {
  display: flex;
  gap: 30rpx;
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666666;
}

.status-ongoing {
  color: #52c41a;
  font-weight: 500;
}

.medication-notes {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f0f0;
}

.medication-notes text {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.5;
}

/* 空状态 */
.empty-state {
  padding: 120rpx 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.empty-hint {
  font-size: 24rpx;
  color: #cccccc;
}

.loading-state {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999999;
}
</style>
