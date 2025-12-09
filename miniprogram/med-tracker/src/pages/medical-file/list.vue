<template>
  <view class="medical-file-list-container">
    <!-- 上传按钮 -->
    <view class="upload-section">
      <button class="upload-btn" @click="goToUpload">
        <text class="upload-icon">📄</text>
        <text>上传病历文件</text>
      </button>
    </view>

    <!-- 文件分类标签 -->
    <view class="category-tabs">
      <view
        v-for="cat in categories"
        :key="cat.value"
        class="tab-item"
        :class="{ active: currentCategory === cat.value }"
        @click="changeCategory(cat.value)"
      >
        <text>{{ cat.label }}</text>
      </view>
    </view>

    <!-- 病历文件列表 -->
    <view class="file-list">
      <view
        v-for="file in filteredFiles"
        :key="file.id"
        class="file-item"
        @click="handleFileClick(file)"
      >
        <view class="file-icon">
          <text>{{ getFileIcon(file.fileType) }}</text>
        </view>
        <view class="file-content">
          <text class="file-name">{{ file.fileName }}</text>
          <view class="file-meta">
            <text class="meta-item">{{ file.category }}</text>
            <text class="meta-item">{{ file.stage }}</text>
            <text class="meta-item">{{ file.uploadedAt }}</text>
          </view>
          <text v-if="file.description" class="file-desc">{{ file.description }}</text>
        </view>
        <view class="file-actions">
          <text class="action-icon">›</text>
        </view>
      </view>

      <view v-if="filteredFiles.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📂</text>
        <text class="empty-text">暂无病历文件</text>
        <text class="empty-hint">点击上方按钮上传</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { medicalFileAPI } from '../../api/medical-file';
import { patientAPI } from '../../api/patient';

const files = ref<any[]>([]);
const loading = ref(false);
const currentCategory = ref('all');

const categories = [
  { value: 'all', label: '全部' },
  { value: '入组资料', label: '入组资料' },
  { value: '知情同意书', label: '知情同意书' },
  { value: '检查报告', label: '检查报告' },
  { value: '病历记录', label: '病历记录' },
  { value: '其他', label: '其他' },
];

// 过滤后的文件列表
const filteredFiles = computed(() => {
  if (currentCategory.value === 'all') {
    return files.value;
  }
  return files.value.filter(f => f.category === currentCategory.value);
});

// 获取文件图标
const getFileIcon = (fileType: string) => {
  if (fileType?.includes('image')) return '🖼️';
  if (fileType?.includes('pdf')) return '📄';
  if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
  if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
  return '📎';
};

// 切换分类
const changeCategory = (category: string) => {
  currentCategory.value = category;
};

// 加载病历文件列表
const loadFiles = async () => {
  try {
    loading.value = true;

    // 获取患者信息
    const patient = await patientAPI.getMyInfo();

    // 获取病历文件列表
    const result = await medicalFileAPI.getList({
      patientId: patient.id,
    });

    // API 返回 { data: files, total, page, pageSize, totalPages }
    files.value = result.data || result.items || result || [];
  } catch (error: any) {
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 跳转到上传页面
const goToUpload = () => {
  uni.navigateTo({
    url: '/pages/medical-file/upload',
  });
};

// 点击文件项
const handleFileClick = (file: any) => {
  uni.showModal({
    title: '文件操作',
    content: `是否预览文件: ${file.fileName}?`,
    confirmText: '预览',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 预览文件
        if (file.fileType?.includes('image')) {
          uni.previewImage({
            urls: [file.fileUrl],
            current: file.fileUrl,
          });
        } else {
          // 下载文件
          uni.downloadFile({
            url: file.fileUrl,
            success: (downloadRes) => {
              if (downloadRes.statusCode === 200) {
                uni.openDocument({
                  filePath: downloadRes.tempFilePath,
                  showMenu: true,
                });
              }
            },
          });
        }
      }
    },
  });
};

onMounted(() => {
  loadFiles();
});

// 监听页面显示(从上传页面返回时刷新)
onShow(() => {
  loadFiles();
});
</script>

<style scoped>
.medical-file-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 上传按钮 */
.upload-section {
  margin-bottom: 30rpx;
}

.upload-btn {
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

.upload-icon {
  font-size: 36rpx;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 12rpx 30rpx;
  background-color: #ffffff;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666666;
  flex-shrink: 0;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 500;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.file-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.file-icon {
  font-size: 48rpx;
  line-height: 1;
}

.file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.file-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 24rpx;
  color: #999999;
  padding: 4rpx 12rpx;
  background-color: #f7f8fa;
  border-radius: 8rpx;
}

.file-desc {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.file-actions {
  display: flex;
  align-items: center;
}

.action-icon {
  font-size: 40rpx;
  color: #d9d9d9;
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
