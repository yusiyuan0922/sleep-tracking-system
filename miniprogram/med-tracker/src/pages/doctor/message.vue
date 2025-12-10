<template>
  <view class="message-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">消息中心</text>
      <text class="mark-all" @click="handleMarkAllRead" v-if="messages.length > 0">全部已读</text>
    </view>

    <!-- 消息分类标签 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
        <view v-if="tab.value === 'unread' && unreadCount > 0" class="tab-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
    >
      <view v-if="loading && messages.length === 0" class="loading-state">
        <text>加载中...</text>
      </view>

      <view v-else-if="messages.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>

      <view v-else class="messages">
        <view
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ unread: !msg.isRead }"
          @click="handleMessageClick(msg)"
        >
          <view class="message-icon" :class="getTypeClass(msg.type)">
            <text>{{ getTypeIcon(msg.type) }}</text>
          </view>
          <view class="message-content">
            <view class="message-header">
              <text class="message-title">{{ msg.title }}</text>
              <text class="message-time">{{ formatTime(msg.createdAt) }}</text>
            </view>
            <text class="message-body">{{ msg.content }}</text>
          </view>
          <view v-if="!msg.isRead" class="unread-dot"></view>
        </view>
      </view>

      <view v-if="loading && messages.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && messages.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 底部 tabbar -->
    <DoctorTabbar current="message" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  getMyMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  MessageDetail,
} from '../../api/message';
import DoctorTabbar from '../../components/doctor-tabbar/index.vue';

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'audit_result', label: '审核通知' },
  { value: 'ae_alert', label: '不良事件' },
];

const activeTab = ref('all');
const messages = ref<MessageDetail[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 20;
const unreadCount = ref(0);

// 加载消息列表
const loadMessages = async (reset = false) => {
  if (loading.value) return;

  try {
    loading.value = true;

    if (reset) {
      page.value = 1;
      hasMore.value = true;
    }

    const params: any = {
      page: page.value,
      pageSize,
    };

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

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCount();
    unreadCount.value = res?.count || 0;
  } catch (error) {
    console.error('获取未读数量失败:', error);
  }
};

// 切换标签
const switchTab = (tab: string) => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  loadMessages(true);
};

// 下拉刷新
const handleRefresh = () => {
  refreshing.value = true;
  loadMessages(true);
  loadUnreadCount();
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadMessages();
};

// 获取消息类型图标
const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    stage_reminder: '📅',
    audit_result: '✅',
    ae_alert: '⚠️',
    system_notice: '📢',
  };
  return icons[type] || '📩';
};

// 获取消息类型样式类
const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    stage_reminder: 'blue',
    audit_result: 'green',
    ae_alert: 'orange',
    system_notice: 'purple',
  };
  return classes[type] || 'blue';
};

// 格式化时间
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) {
    return '刚刚';
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
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
const handleMessageClick = async (msg: MessageDetail) => {
  // 标记为已读
  if (!msg.isRead) {
    try {
      await markAsRead([msg.id]);
      msg.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
      uni.$emit('message-read');

      // 如果当前在"未读"标签下，从列表中移除该消息
      if (activeTab.value === 'unread') {
        messages.value = messages.value.filter(m => m.id !== msg.id);
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  // 根据消息类型跳转
  // 优先使用带参数的 navigateTo，否则根据数据中的 ID 构建 URL
  const targetUrl = msg.data?.navigateTo;

  if (targetUrl && targetUrl.includes('?')) {
    // targetUrl 已经包含参数，直接使用
    smartNavigate(targetUrl);
  } else if (msg.data?.aeId) {
    // 不良事件详情
    smartNavigate(`/pages/adverse-event/detail?id=${msg.data.aeId}`);
  } else if (msg.data?.patientId) {
    // 患者详情
    smartNavigate(`/pages/doctor/patient-detail?id=${msg.data.patientId}`);
  } else if (targetUrl) {
    // targetUrl 不带参数，但也没有其他 ID，直接跳转
    smartNavigate(targetUrl);
  }
};

// 全部标记为已读
const handleMarkAllRead = async () => {
  try {
    await markAllAsRead();
    messages.value.forEach(msg => {
      msg.isRead = true;
    });
    unreadCount.value = 0;
    uni.$emit('message-read');

    // 如果当前在"未读"标签下，清空列表
    if (activeTab.value === 'unread') {
      messages.value = [];
    }

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
};

onMounted(() => {
  loadMessages(true);
  loadUnreadCount();
});

onShow(() => {
  loadMessages(true);
  loadUnreadCount();
});
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.page-header {
  background-color: #ffffff;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.mark-all {
  font-size: 26rpx;
  color: #667eea;
}

.tabs {
  display: flex;
  background-color: #ffffff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  padding: 24rpx 20rpx;
  font-size: 28rpx;
  color: #666666;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tab-item.active {
  color: #667eea;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20rpx;
  right: 20rpx;
  height: 4rpx;
  background-color: #667eea;
  border-radius: 2rpx;
}

.tab-badge {
  min-width: 32rpx;
  height: 32rpx;
  background-color: #ff4d4f;
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.message-list {
  height: calc(100vh - 200rpx - 120rpx);
}

.messages {
  padding: 20rpx;
}

.message-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  gap: 20rpx;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.message-item.unread {
  background-color: #f6f8ff;
}

.message-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.message-icon.blue {
  background-color: #e6f7ff;
}

.message-icon.green {
  background-color: #f6ffed;
}

.message-icon.orange {
  background-color: #fff7e6;
}

.message-icon.purple {
  background-color: #f9f0ff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10rpx;
}

.message-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 22rpx;
  color: #999999;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.message-body {
  font-size: 26rpx;
  color: #666666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #ff4d4f;
  border-radius: 50%;
}

.loading-state,
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

.loading-more,
.no-more {
  text-align: center;
  padding: 30rpx;
  font-size: 26rpx;
  color: #999999;
}
</style>
