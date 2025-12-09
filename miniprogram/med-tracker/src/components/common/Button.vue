<template>
  <button
    class="app-button"
    :class="[
      type,
      size,
      { block, round, disabled: disabled || loading, loading },
    ]"
    :disabled="disabled || loading"
    :form-type="formType"
    :open-type="openType"
    @click="handleClick"
    @getphonenumber="handleGetPhoneNumber"
  >
    <!-- 加载中图标 -->
    <view v-if="loading" class="loading-icon">
      <view class="loading-spinner"></view>
    </view>

    <!-- 前置图标 -->
    <text v-if="icon && !loading" class="btn-icon">{{ icon }}</text>

    <!-- 按钮文字 -->
    <text class="btn-text">
      <slot>{{ loading ? loadingText : '' }}</slot>
    </text>
  </button>
</template>

<script setup lang="ts">
// Props 定义
interface Props {
  // 按钮类型
  type?: 'primary' | 'secondary' | 'danger' | 'warning' | 'text' | 'ghost'
  // 按钮尺寸
  size?: 'large' | 'medium' | 'small' | 'mini'
  // 前置图标 (emoji)
  icon?: string
  // 是否为块级按钮
  block?: boolean
  // 是否为圆角按钮
  round?: boolean
  // 是否禁用
  disabled?: boolean
  // 是否加载中
  loading?: boolean
  // 加载中文字
  loadingText?: string
  // 表单类型 (submit/reset)
  formType?: '' | 'submit' | 'reset'
  // 微信开放能力
  openType?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  block: false,
  round: true,
  disabled: false,
  loading: false,
  loadingText: '加载中...',
  formType: '',
  openType: '',
})

// 事件
const emit = defineEmits<{
  (e: 'click', event: Event): void
  (e: 'getphonenumber', detail: any): void
}>()

// 处理点击事件
const handleClick = (event: Event) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}

// 处理获取手机号
const handleGetPhoneNumber = (e: any) => {
  emit('getphonenumber', e.detail)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-md;
  border: none;
  font-weight: $font-weight-medium;
  transition: all $transition-fast;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &::after {
    border: none;
  }

  &:active:not(.disabled) {
    opacity: 0.85;
    transform: scale(0.98);
  }

  // ============ 类型样式 ============

  // 主按钮
  &.primary {
    background: $color-primary-gradient;
    color: #ffffff;
  }

  // 次按钮
  &.secondary {
    background-color: $color-bg-card;
    color: $color-primary;
    border: 2rpx solid $color-primary;
  }

  // 危险按钮
  &.danger {
    background: $color-danger-gradient;
    color: #ffffff;
  }

  // 警告按钮
  &.warning {
    background-color: $color-warning;
    color: #ffffff;
  }

  // 文字按钮
  &.text {
    background: transparent;
    color: $color-primary;
    padding: 0 $spacing-sm;
  }

  // 幽灵按钮
  &.ghost {
    background: transparent;
    color: $color-primary;
    border: 2rpx solid $color-primary;
  }

  // ============ 尺寸样式 ============

  // 大号
  &.large {
    height: $btn-height-lg;
    font-size: $font-size-h3;
    border-radius: $radius-btn;
  }

  // 中号 (默认)
  &.medium {
    height: $btn-height-md;
    font-size: $font-size-body;
    border-radius: $radius-btn;
  }

  // 小号
  &.small {
    height: $btn-height-sm;
    font-size: $font-size-caption;
    border-radius: $radius-btn-sm;
    padding: 0 $spacing-sm;
  }

  // 迷你
  &.mini {
    height: 50rpx;
    font-size: $font-size-small;
    border-radius: 25rpx;
    padding: 0 $spacing-xs;
  }

  // ============ 状态样式 ============

  // 块级按钮
  &.block {
    display: flex;
    width: 100%;
  }

  // 圆角按钮 (默认开启)
  &.round {
    &.large {
      border-radius: $btn-height-lg / 2;
    }

    &.medium {
      border-radius: $btn-height-md / 2;
    }

    &.small {
      border-radius: $btn-height-sm / 2;
    }

    &.mini {
      border-radius: 25rpx;
    }
  }

  // 禁用状态
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  // 加载状态
  &.loading {
    pointer-events: none;
  }
}

// 加载图标
.loading-icon {
  margin-right: $spacing-xs;

  .loading-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// 次按钮的加载图标
.secondary .loading-spinner,
.ghost .loading-spinner,
.text .loading-spinner {
  border-color: rgba($color-primary, 0.3);
  border-top-color: $color-primary;
}

// 前置图标
.btn-icon {
  margin-right: $spacing-xs;
  font-size: inherit;
}

// 按钮文字
.btn-text {
  font-size: inherit;
}

// 旋转动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
