<template>
  <view class="medical-file-upload-container">
    <!-- 已上传的文件列表 -->
    <view class="uploaded-section" v-if="uploadedFiles.length > 0">
      <view class="section-header">
        <text class="section-title">已上传的病历图片 ({{ uploadedFiles.length }}张)</text>
      </view>
      <view class="uploaded-files">
        <view class="uploaded-item" v-for="file in uploadedFiles" :key="file.id">
          <image
            :src="file.fileUrl"
            mode="aspectFill"
            class="uploaded-image"
            @click="previewImage(file.fileUrl)"
          />
          <view class="file-info">
            <text class="file-name">{{ file.fileName }}</text>
            <text class="file-date">{{ formatDate(file.createdAt) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="form-container">
      <view class="form-item">
        <text class="label">上传病例图片 <text class="required">*</text></text>
        <view class="file-upload-section">
          <view class="selected-files" v-if="selectedFiles.length > 0">
            <view class="file-item" v-for="(file, index) in selectedFiles" :key="index">
              <view class="file-preview">
                <image :src="file.path" mode="aspectFill" class="preview-image" />
                <view class="remove-btn" @click="removeFile(index)">×</view>
              </view>
            </view>
            <button class="add-more-btn" @click="selectFile" v-if="selectedFiles.length < 9">
              <text class="add-icon">+</text>
            </button>
          </view>
          <button v-else class="select-file-btn" @click="selectFile">
            <text class="select-icon">📷</text>
            <text>选择图片</text>
          </button>
        </view>
        <view class="upload-tips">
          <text>支持JPG、PNG等图片格式，最多9张</text>
          <text>单个文件大小不超过10MB</text>
        </view>
      </view>

      <button class="submit-btn" @click="handleSubmit" :loading="submitting" :disabled="selectedFiles.length === 0">
        上传 {{ selectedFiles.length > 0 ? `(${selectedFiles.length}张)` : '' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { medicalFileAPI } from '../../api/medical-file';
import { patientAPI } from '../../api/patient';
import { config } from '../../config';

const submitting = ref(false);

// 从URL参数获取患者ID和阶段(医生代患者上传时使用)
const urlPatientId = ref<number | null>(null);
const urlStage = ref<string | null>(null);

const selectedFiles = ref<any[]>([]);
const uploadedFiles = ref<any[]>([]);
const loading = ref(false);

// 选择图片文件
const selectFile = () => {
  console.log('selectFile 被调用');
  const maxCount = 9 - selectedFiles.value.length;

  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      console.log('uni.chooseImage 成功:', res);

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        res.tempFilePaths.forEach((path: string, index: number) => {
          const tempFile = res.tempFiles[index];
          selectedFiles.value.push({
            path: path,
            name: `病例图片_${Date.now()}_${index}.jpg`,
            type: 'image/jpeg',
            size: tempFile.size,
          });
        });
        console.log('文件选择成功,已选择:', selectedFiles.value.length, '张');
      } else {
        console.log('没有选择文件');
      }
    },
    fail: (error) => {
      console.error('选择文件失败:', error);
      if (error.errMsg && !error.errMsg.includes('cancel')) {
        uni.showToast({
          title: '选择文件失败',
          icon: 'none',
        });
      }
    }
  });
};

// 移除图片
const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

// 表单验证
const validateForm = () => {
  if (selectedFiles.value.length === 0) {
    uni.showToast({ title: '请选择图片', icon: 'none' });
    return false;
  }
  // 检查文件大小(10MB限制)
  for (const file of selectedFiles.value) {
    if (file.size > 10 * 1024 * 1024) {
      uni.showToast({ title: '单个文件大小不能超过10MB', icon: 'none' });
      return false;
    }
  }
  return true;
};

// 提交
const handleSubmit = async () => {
  console.log('handleSubmit 被调用');
  console.log('selectedFiles:', selectedFiles.value);
  console.log('urlPatientId:', urlPatientId.value);

  if (!validateForm()) {
    console.log('表单验证失败');
    return;
  }

  try {
    submitting.value = true;
    console.log('开始处理上传...');

    // 确定患者ID(医生代上传时使用URL参数,患者自己上传时获取自己的信息)
    let patientId: number;
    if (urlPatientId.value) {
      // 医生为患者上传
      patientId = urlPatientId.value;
      console.log('使用URL参数中的患者ID:', patientId);
    } else {
      // 患者自己上传(已移除此功能,但保留兼容性)
      console.log('获取患者自己的信息...');
      const patient = await patientAPI.getMyInfo();
      patientId = patient.id;
      console.log('获取到患者ID:', patientId);
    }

    console.log(`开始上传 ${selectedFiles.value.length} 张图片`);
    console.log('上传URL:', `${config.baseURL}/upload/single`);
    console.log('Token:', uni.getStorageSync(config.tokenKey));

    let successCount = 0;
    let failCount = 0;

    // 逐个上传文件
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i];

      try {
        // 使用 Promise 包装 uni.uploadFile
        await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${config.baseURL}/upload/single`,
            filePath: file.path,
            name: 'file',
            formData: {
              patientId: patientId.toString(),
            },
            header: {
              'Authorization': `Bearer ${uni.getStorageSync(config.tokenKey)}`,
            },
            success: async (uploadRes) => {
              console.log(`第 ${i + 1} 张上传响应:`, uploadRes);

              if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
                const uploadData = JSON.parse(uploadRes.data);
                console.log(`第 ${i + 1} 张上传成功,文件URL:`, uploadData.data.url);

                // 创建病历文件记录
                await medicalFileAPI.upload({
                  fileName: uploadData.data.fileName,
                  fileCategory: 'medical_record',
                  stage: urlStage.value || 'V1',
                  description: '',
                  patientId,
                  fileUrl: uploadData.data.url,
                  fileType: uploadData.data.fileType,
                  fileSize: uploadData.data.fileSize,
                });

                successCount++;
                resolve(uploadData);
              } else {
                console.error(`第 ${i + 1} 张上传失败,状态码:`, uploadRes.statusCode);
                failCount++;
                reject(new Error(`状态码: ${uploadRes.statusCode}`));
              }
            },
            fail: (error) => {
              console.error(`第 ${i + 1} 张上传失败:`, error);
              failCount++;
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error(`第 ${i + 1} 张处理失败:`, error);
        // 继续上传下一张
      }
    }

    // 显示上传结果
    if (successCount > 0) {
      uni.showToast({
        title: `成功上传${successCount}张${failCount > 0 ? `，失败${failCount}张` : ''}`,
        icon: successCount === selectedFiles.value.length ? 'success' : 'none',
        duration: 2000,
      });

      // 清空已选择的文件
      selectedFiles.value = [];
      // 刷新已上传文件列表
      await loadUploadedFiles();
    } else {
      uni.showToast({
        title: '全部上传失败',
        icon: 'none',
        duration: 2000,
      });
    }
  } catch (error: any) {
    console.error('上传错误:', error);
    uni.showToast({
      title: error.message || '上传失败',
      icon: 'none',
      duration: 2000,
    });
  } finally {
    submitting.value = false;
  }
};

// 加载已上传的文件
const loadUploadedFiles = async () => {
  if (!urlPatientId.value) return;

  try {
    loading.value = true;
    const params: any = {
      patientId: urlPatientId.value,
    };
    if (urlStage.value) {
      params.stage = urlStage.value;
    }
    const res = await medicalFileAPI.getList(params);
    // API 返回 { data: files, total, page, pageSize, totalPages }
    uploadedFiles.value = res.data || res.items || res || [];
    console.log('已上传的文件:', uploadedFiles.value);
  } catch (error) {
    console.error('加载已上传文件失败:', error);
  } finally {
    loading.value = false;
  }
};

// 预览图片
const previewImage = (url: string) => {
  const urls = uploadedFiles.value.map(f => f.fileUrl);
  uni.previewImage({
    current: url,
    urls: urls,
  });
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 页面加载时接收URL参数
onLoad((options: any) => {
  console.log('onLoad 参数:', options);
  if (options.patientId) {
    urlPatientId.value = parseInt(options.patientId);
    console.log('设置 patientId:', urlPatientId.value);
  }
  if (options.stage) {
    urlStage.value = options.stage;
    console.log('设置 stage:', urlStage.value);
  }
});

// 页面显示时加载已上传的文件
onShow(() => {
  console.log('onShow 触发, patientId:', urlPatientId.value);
  if (urlPatientId.value) {
    loadUploadedFiles();
  }
});
</script>

<style scoped>
.medical-file-upload-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

/* 已上传文件区域 */
.uploaded-section {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
}

.uploaded-files {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.uploaded-item {
  width: 200rpx;
}

.uploaded-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 10rpx;
  background-color: #f7f8fa;
}

.file-info {
  margin-top: 10rpx;
}

.file-name {
  display: block;
  font-size: 22rpx;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-date {
  display: block;
  font-size: 20rpx;
  color: #999999;
  margin-top: 4rpx;
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

.file-upload-section {
  margin-top: 20rpx;
}

.selected-files {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.file-item {
  width: 200rpx;
  height: 200rpx;
}

.file-preview {
  width: 100%;
  height: 100%;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  overflow: hidden;
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 50rpx;
  height: 50rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 40rpx;
  line-height: 50rpx;
  text-align: center;
  border-radius: 0 10rpx 0 10rpx;
}

.add-more-btn {
  width: 200rpx;
  height: 200rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #d9d9d9;
}

.add-icon {
  font-size: 80rpx;
  color: #999999;
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
