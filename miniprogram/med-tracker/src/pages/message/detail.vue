<template>
  <view class="message-detail-page">
    <view v-if="message" class="message-container">
      <!-- 消息头部 -->
      <view class="message-header">
        <view class="header-icon">
          <text class="icon" :class="`icon-${message.type}`">
            {{ getMessageIcon(message.type) }}
          </text>
        </view>
        <view class="header-info">
          <text class="message-title">{{ message.title }}</text>
          <text class="message-time">{{ formatTime(message.createdAt) }}</text>
        </view>
      </view>

      <!-- 消息内容 -->
      <view class="message-content">
        <text class="content-text">{{ message.content }}</text>
      </view>

      <!-- 相关信息 -->
      <view v-if="message.data" class="message-meta">
        <view v-if="message.data.stage" class="meta-item">
          <text class="meta-label">相关阶段:</text>
          <text class="meta-value">{{ message.data.stage }}</text>
        </view>
        <view v-if="message.data.patientId" class="meta-item">
          <text class="meta-label">患者ID:</text>
          <text class="meta-value">{{ message.data.patientId }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="message.data?.navigateTo" class="action-buttons">
        <button class="action-btn primary" @click="handleNavigate">
          {{ getActionButtonText(message.type) }}
        </button>
      </view>

      <!-- 删除按钮 -->
      <view class="delete-section">
        <button class="delete-btn" @click="handleDelete">删除此消息</button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading-container">
      <text>加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-icon">❌</text>
      <text class="error-text">消息不存在或已被删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMessageDetail, markAsRead, deleteMessage, type MessageDetail } from '@/api/message';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 状态
const message = ref<MessageDetail | null>(null);
const loading = ref(true);
const messageId = ref<number>(0);

// 获取消息详情
const fetchMessageDetail = async () => {
  loading.value = true;

  try {
    const res = await getMessageDetail(messageId.value);
    message.value = res;

    // 如果消息未读,标记为已读
    if (!res.isRead) {
      await markAsRead([messageId.value]);

      // 通知其他页面更新未读数
      uni.$emit('message-read');
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 导航到相关页面
const handleNavigate = () => {
  if (!message.value?.data?.navigateTo) return;

  uni.navigateTo({
    url: message.value.data.navigateTo,
    fail: () => {
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none',
      });
    },
  });
};

// 删除消息
const handleDelete = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条消息吗?',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteMessage(messageId.value);

          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });

          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1000);
        } catch (error: any) {
          uni.showToast({
            title: error.message || '删除失败',
            icon: 'none',
          });
        }
      }
    },
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 获取消息图标
const getMessageIcon = (type: string) => {
  const icons: Record<string, string> = {
    system_notice: '📢',
    audit_result: '📋',
    stage_reminder: '⏰',
    ae_alert: '⚠️',
  };
  return icons[type] || '📨';
};

// 获取操作按钮文本
const getActionButtonText = (type: string) => {
  const texts: Record<string, string> = {
    system_notice: '查看详情',
    audit_result: '查看审核',
    stage_reminder: '去填写',
    ae_alert: '查看详情',
  };
  return texts[type] || '去处理';
};

// 格式化时间(完整格式)
const formatTime = (time: string) => {
  try {
    const date = new Date(time);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // 24小时内显示相对时间
    if (diffInHours < 24) {
      return formatDistanceToNow(date, {
        locale: zhCN,
        addSuffix: true,
      });
    }

    // 否则显示完整时间
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
  } catch {
    return time;
  }
};

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options || currentPage.$route?.query;

  if (options?.id) {
    messageId.value = Number(options.id);
    fetchMessageDetail();
  } else {
    loading.value = false;
    uni.showToast({
      title: '消息ID不存在',
      icon: 'none',
    });
  }
});
</script>

<style lang="scss" scoped>
.message-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.message-container {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.message-header {
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
}

.header-icon {
  .icon {
    font-size: 80rpx;
    display: block;
  }
}

.header-info {
  flex: 1;
  margin-left: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.message-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
}

.message-time {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.message-content {
  padding: 40rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.content-text {
  font-size: 32rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.message-meta {
  padding: 30rpx 40rpx;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #e5e5e5;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.meta-label {
  font-size: 28rpx;
  color: #999;
  min-width: 150rpx;
}

.meta-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.action-buttons {
  padding: 40rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &::after {
    border: none;
  }
}

.delete-section {
  padding: 40rpx;
}

.delete-btn {
  width: 100%;
  height: 88rpx;
  background-color: transparent;
  border: 1rpx solid #ff3b30;
  border-radius: 12rpx;
  font-size: 32rpx;
  color: #ff3b30;

  &::after {
    border: none;
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-container {
  text {
    font-size: 28rpx;
    color: #999;
  }
}

.error-container {
  .error-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }

  .error-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 50rpx;
  }

  .back-btn {
    width: 300rpx;
    height: 80rpx;
    background-color: #007aff;
    color: #fff;
    border: none;
    border-radius: 12rpx;
    font-size: 32rpx;

    &::after {
      border: none;
    }
  }
}
</style>
