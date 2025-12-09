<template>
  <view class="empty-container" :style="{ paddingTop: paddingTop }">
    <!-- 图标区域 -->
    <view class="empty-icon">
      <text v-if="icon" class="icon-emoji">{{ icon }}</text>
      <image
        v-else-if="image"
        :src="image"
        class="icon-image"
        mode="aspectFit"
      />
      <text v-else class="icon-emoji">{{ defaultIcon }}</text>
    </view>

    <!-- 标题 -->
    <text class="empty-title">{{ title || defaultTitle }}</text>

    <!-- 描述文字 -->
    <text v-if="description" class="empty-description">{{ description }}</text>

    <!-- 操作按钮 -->
    <view v-if="actionText" class="empty-action">
      <button class="action-btn" :class="actionType" @click="handleAction">
        {{ actionText }}
      </button>
    </view>

    <!-- 插槽内容 -->
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props 定义
interface Props {
  // 类型：决定默认图标和文案
  type?: 'default' | 'data' | 'search' | 'network' | 'task' | 'message' | 'file'
  // 自定义图标 emoji
  icon?: string
  // 自定义图片
  image?: string
  // 标题
  title?: string
  // 描述
  description?: string
  // 操作按钮文字
  actionText?: string
  // 操作按钮类型
  actionType?: 'primary' | 'secondary' | 'text'
  // 顶部间距
  paddingTop?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  actionType: 'primary',
  paddingTop: '100rpx',
})

// 事件
const emit = defineEmits<{
  (e: 'action'): void
}>()

// 类型对应的默认配置
const typeConfig = {
  default: { icon: '', title: '暂无内容' },
  data: { icon: '', title: '暂无数据' },
  search: { icon: '', title: '未找到相关结果' },
  network: { icon: '', title: '网络连接失败' },
  task: { icon: '', title: '暂无待办任务' },
  message: { icon: '', title: '暂无消息' },
  file: { icon: '', title: '暂无文件' },
}

// 计算默认图标
const defaultIcon = computed(() => {
  return typeConfig[props.type]?.icon || ''
})

// 计算默认标题
const defaultTitle = computed(() => {
  return typeConfig[props.type]?.title || '暂无内容'
})

// 处理操作按钮点击
const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg $spacing-md;
  text-align: center;
}

.empty-icon {
  margin-bottom: $spacing-sm;

  .icon-emoji {
    font-size: 120rpx;
    line-height: 1;
  }

  .icon-image {
    width: 200rpx;
    height: 200rpx;
  }
}

.empty-title {
  font-size: $font-size-h3;
  color: $color-text-secondary;
  margin-bottom: $spacing-xs;
  font-weight: $font-weight-medium;
}

.empty-description {
  font-size: $font-size-caption;
  color: $color-text-placeholder;
  line-height: $line-height-loose;
  max-width: 500rpx;
  margin-bottom: $spacing-md;
}

.empty-action {
  margin-top: $spacing-sm;

  .action-btn {
    min-width: 200rpx;
    padding: 0 $spacing-md;
    height: $btn-height-sm;
    line-height: $btn-height-sm;
    font-size: $font-size-body;
    border-radius: $radius-btn-sm;
    transition: all $transition-fast;

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }

    // 主按钮
    &.primary {
      background: $color-primary-gradient;
      color: #ffffff;
      border: none;
    }

    // 次按钮
    &.secondary {
      background-color: $color-bg-card;
      color: $color-primary;
      border: 2rpx solid $color-primary;
    }

    // 文字按钮
    &.text {
      background: transparent;
      color: $color-primary;
      border: none;
    }
  }
}
</style>
