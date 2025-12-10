<template>
  <view class="message-list-page">
    <!-- 顶部筛选栏 -->
    <view class="filter-bar">
      <view class="filter-tabs">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="handleTabChange(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>
      <view class="filter-actions">
        <text class="mark-all-btn" @click="handleMarkAllAsRead">全部已读</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view v-if="messages.length > 0" class="message-list">
        <view
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.isRead }"
          @click="handleMessageClick(message)"
        >
          <view class="message-icon">
            <text class="icon" :class="`icon-${message.type}`">
              {{ getMessageIcon(message.type) }}
            </text>
            <view v-if="!message.isRead" class="unread-dot"></view>
          </view>
          <view class="message-content">
            <view class="message-header">
              <text class="message-title">{{ message.title }}</text>
              <text class="message-time">{{ formatTime(message.createdAt) }}</text>
            </view>
            <view class="message-body">
              <text class="message-text">{{ message.content }}</text>
            </view>
          </view>
          <view class="message-arrow">
            <text class="arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && messages.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-if="!hasMore && messages.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMyMessages, markAsRead, markAllAsRead, type MessageDetail } from '@/api/message';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 消息类型标签
const tabs = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '系统通知', value: 'system_notice' },
  { label: '审核消息', value: 'audit_result' },
  { label: '阶段提醒', value: 'stage_reminder' },
  { label: '不良事件', value: 'ae_alert' },
];

// 状态
const activeTab = ref('all');
const messages = ref<MessageDetail[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 20;

// 获取消息列表
const fetchMessages = async (reset = false) => {
  if (loading.value) return;

  if (reset) {
    page.value = 1;
    hasMore.value = true;
    messages.value = [];
  }

  loading.value = true;

  try {
    const params: any = {
      page: page.value,
      pageSize,
    };

    // 根据选中的tab筛选
    if (activeTab.value === 'unread') {
      params.isRead = false;
    } else if (activeTab.value !== 'all') {
      params.type = activeTab.value;
    }

    const res = await getMyMessages(params);

    // 安全地提取数组数据
    const dataList = res?.data || res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total || 0;

    if (reset) {
      messages.value = dataList;
    } else {
      messages.value = [...messages.value, ...dataList];
    }

    hasMore.value = messages.value.length < total;
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 切换tab
const handleTabChange = (value: string) => {
  activeTab.value = value;
  fetchMessages(true);
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  fetchMessages(true);
};

// 加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  fetchMessages();
};

// tabbar 页面列表
const tabbarPages = [
  '/pages/index/index',
  '/pages/scale/list',
  '/pages/medication/list',
  '/pages/profile/index',
];

// 判断是否是 tabbar 页面
const isTabbarPage = (url: string) => {
  const path = url.split('?')[0]; // 去除查询参数
  return tabbarPages.some(tabPath => path === tabPath);
};

// 智能导航：自动判断使用 navigateTo 还是 switchTab
const smartNavigate = (url: string) => {
  if (isTabbarPage(url)) {
    uni.switchTab({ url: url.split('?')[0] }); // switchTab 不支持参数
  } else {
    uni.navigateTo({ url });
  }
};

// 点击消息
const handleMessageClick = async (message: MessageDetail) => {
  // 标记为已读
  if (!message.isRead) {
    try {
      await markAsRead([message.id]);
      message.isRead = true;

      // 通知其他页面更新未读数
      uni.$emit('message-read');
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  // 如果有导航信息,跳转到对应页面
  if (message.data?.navigateTo) {
    smartNavigate(message.data.navigateTo);
  } else {
    // 否则跳转到消息详情页
    uni.navigateTo({
      url: `/pages/message/detail?id=${message.id}`,
    });
  }
};

// 全部标记为已读
const handleMarkAllAsRead = async () => {
  uni.showModal({
    title: '提示',
    content: '确定要将所有消息标记为已读吗?',
    success: async (res) => {
      if (res.confirm) {
        try {
          await markAllAsRead();
          messages.value.forEach((msg) => {
            msg.isRead = true;
          });

          // 通知其他页面更新未读数
          uni.$emit('message-read');

          uni.showToast({
            title: '已全部标记为已读',
            icon: 'success',
          });
        } catch (error: any) {
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'none',
          });
        }
      }
    },
  });
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

// 格式化时间
const formatTime = (time: string) => {
  try {
    return formatDistanceToNow(new Date(time), {
      locale: zhCN,
      addSuffix: true,
    });
  } catch {
    return time;
  }
};

onMounted(() => {
  fetchMessages(true);
});
</script>

<style lang="scss" scoped>
.message-list-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  background-color: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
  flex-shrink: 0;

  &.active {
    background-color: #007aff;
    color: #fff;
  }
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.mark-all-btn {
  font-size: 28rpx;
  color: #007aff;
  padding: 10rpx 20rpx;
}

.message-scroll {
  flex: 1;
  height: calc(100vh - 200rpx);
}

.message-list {
  padding: 20rpx;
}

.message-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  &.unread {
    background-color: #f0f7ff;
  }
}

.message-icon {
  position: relative;
  margin-right: 20rpx;

  .icon {
    font-size: 48rpx;
    display: block;
  }

  .unread-dot {
    position: absolute;
    top: 0;
    right: 0;
    width: 16rpx;
    height: 16rpx;
    background-color: #ff3b30;
    border-radius: 50%;
    border: 2rpx solid #fff;
  }
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.message-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  margin-left: 20rpx;
  flex-shrink: 0;
}

.message-body {
  .message-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.message-arrow {
  margin-left: 20rpx;
  display: flex;
  align-items: center;

  .arrow {
    font-size: 48rpx;
    color: #ccc;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.loading-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  font-size: 28rpx;
  color: #999;
}
</style>
