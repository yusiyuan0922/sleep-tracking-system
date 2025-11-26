<template>
  <view class="medical-file-upload-container">
    <view class="form-container">
      <view class="form-item">
        <text class="label">文件名称 <text class="required">*</text></text>
        <input
          class="input"
          v-model="formData.fileName"
          placeholder="请输入文件名称"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="label">文件分类 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="categories"
          :value="categoryIndex"
          @change="onCategoryChange"
        >
          <view class="picker">
            <text v-if="formData.category">{{ formData.category }}</text>
            <text v-else class="placeholder">请选择文件分类</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">所属阶段 <text class="required">*</text></text>
        <picker
          mode="selector"
          :range="stages"
          :value="stageIndex"
          @change="onStageChange"
        >
          <view class="picker">
            <text v-if="formData.stage">{{ formData.stage }}</text>
            <text v-else class="placeholder">请选择阶段</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">文件描述</text>
        <textarea
          class="textarea"
          v-model="formData.description"
          placeholder="请输入文件描述信息"
          placeholder-class="placeholder"
          maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="label">选择文件 <text class="required">*</text></text>
        <view class="file-upload-section">
          <view v-if="selectedFile" class="selected-file">
            <view class="file-preview">
              <image v-if="isImage" :src="selectedFile.path" mode="aspectFit" class="preview-image" />
              <view v-else class="file-placeholder">
                <text class="file-icon">{{ getFileIcon(selectedFile.type) }}</text>
                <text class="file-size">{{ formatFileSize(selectedFile.size) }}</text>
              </view>
            </view>
            <text class="file-name">{{ selectedFile.name }}</text>
            <button class="change-file-btn" @click="selectFile">更换文件</button>
          </view>
          <button v-else class="select-file-btn" @click="selectFile">
            <text class="select-icon">📁</text>
            <text>选择文件</text>
          </button>
        </view>
        <view class="upload-tips">
          <text>支持图片、PDF、Word、Excel等格式</text>
          <text>文件大小不超过10MB</text>
        </view>
      </view>

      <button class="submit-btn" @click="handleSubmit" :loading="submitting" :disabled="!selectedFile">
        上传
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { medicalFileAPI } from '../../api/medical-file';
import { patientAPI } from '../../api/patient';

const submitting = ref(false);

const categories = ['入组资料', '知情同意书', '检查报告', '病历记录', '其他'];
const categoryIndex = ref(0);

const stages = ['V1', 'V2', 'V3', 'V4'];
const stageIndex = ref(0);

const selectedFile = ref<any>(null);

const formData = ref({
  fileName: '',
  category: '入组资料',
  stage: 'V1',
  description: '',
});

// 是否为图片
const isImage = computed(() => {
  return selectedFile.value?.type?.includes('image');
});

// 获取文件图标
const getFileIcon = (fileType: string) => {
  if (fileType?.includes('pdf')) return '📄';
  if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
  if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
  return '📎';
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (!size) return '0B';
  if (size < 1024) return size + 'B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + 'KB';
  return (size / (1024 * 1024)).toFixed(2) + 'MB';
};

// 分类改变
const onCategoryChange = (e: any) => {
  categoryIndex.value = e.detail.value;
  formData.value.category = categories[categoryIndex.value];
};

// 阶段改变
const onStageChange = (e: any) => {
  stageIndex.value = e.detail.value;
  formData.value.stage = stages[stageIndex.value];
};

// 选择文件
const selectFile = async () => {
  try {
    // 先让用户选择文件类型
    const typeRes = await uni.showActionSheet({
      itemList: ['图片', '其他文件'],
    });

    if (typeRes[1].tapIndex === 0) {
      // 选择图片
      const res = await uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });

      if (res[1].tempFilePaths && res[1].tempFilePaths.length > 0) {
        const tempFile = res[1].tempFiles[0];
        selectedFile.value = {
          path: res[1].tempFilePaths[0],
          name: `图片_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: tempFile.size,
        };

        // 自动填充文件名
        if (!formData.value.fileName) {
          formData.value.fileName = selectedFile.value.name;
        }
      }
    } else if (typeRes[1].tapIndex === 1) {
      // 选择其他文件（需要使用chooseMessageFile）
      const res = await uni.chooseMessageFile({
        count: 1,
        type: 'file',
      });

      if (res[1].tempFiles && res[1].tempFiles.length > 0) {
        const tempFile = res[1].tempFiles[0];
        selectedFile.value = {
          path: tempFile.path,
          name: tempFile.name,
          type: tempFile.type || 'application/octet-stream',
          size: tempFile.size,
        };

        // 自动填充文件名
        if (!formData.value.fileName) {
          formData.value.fileName = selectedFile.value.name;
        }
      }
    }
  } catch (error: any) {
    console.error('选择文件失败:', error);
  }
};

// 表单验证
const validateForm = () => {
  if (!formData.value.fileName) {
    uni.showToast({ title: '请输入文件名称', icon: 'none' });
    return false;
  }
  if (!formData.value.category) {
    uni.showToast({ title: '请选择文件分类', icon: 'none' });
    return false;
  }
  if (!formData.value.stage) {
    uni.showToast({ title: '请选择所属阶段', icon: 'none' });
    return false;
  }
  if (!selectedFile.value) {
    uni.showToast({ title: '请选择文件', icon: 'none' });
    return false;
  }
  // 检查文件大小（10MB限制）
  if (selectedFile.value.size > 10 * 1024 * 1024) {
    uni.showToast({ title: '文件大小不能超过10MB', icon: 'none' });
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

    // 上传文件
    const uploadRes = await uni.uploadFile({
      url: 'http://localhost:3000/upload',
      filePath: selectedFile.value.path,
      name: 'file',
      formData: {
        patientId: patient.id,
      },
    });

    if (uploadRes[1].statusCode === 200 || uploadRes[1].statusCode === 201) {
      const uploadData = JSON.parse(uploadRes[1].data);

      // 创建病历文件记录
      await medicalFileAPI.create({
        ...formData.value,
        patientId: patient.id,
        fileUrl: uploadData.url,
        fileType: selectedFile.value.type,
        fileSize: selectedFile.value.size,
      });

      uni.showToast({
        title: '上传成功',
        icon: 'success',
        duration: 1500,
      });

      // 返回上一页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      throw new Error('文件上传失败');
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '上传失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.medical-file-upload-container {
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

.file-upload-section {
  margin-top: 20rpx;
}

.selected-file {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 30rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
}

.file-preview {
  width: 100%;
  height: 400rpx;
  background-color: #ffffff;
  border-radius: 10rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.file-icon {
  font-size: 100rpx;
}

.file-size {
  font-size: 24rpx;
  color: #999999;
}

.file-name {
  font-size: 26rpx;
  color: #333333;
  word-break: break-all;
}

.change-file-btn {
  height: 70rpx;
  background-color: #ffffff;
  color: #667eea;
  border-radius: 10rpx;
  font-size: 26rpx;
  border: 2rpx solid #667eea;
}

.select-file-btn {
  width: 100%;
  height: 200rpx;
  background-color: #f7f8fa;
  color: #666666;
  border-radius: 10rpx;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  border: 2rpx dashed #d9d9d9;
}

.select-icon {
  font-size: 64rpx;
}

.upload-tips {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.upload-tips text {
  font-size: 24rpx;
  color: #999999;
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

.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
