<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style lang="scss">
/**
 * 全局公共样式
 * 睡眠小程序统一设计规范
 */
@import './styles/variables.scss';

/* 页面基础样式 */
page {
  background-color: $color-bg-page;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;
  font-size: $font-size-body;
  color: $color-text-primary;
  line-height: $line-height-normal;
  -webkit-font-smoothing: antialiased;
}

/* 通用工具类 */

/* 点击反馈 */
.clickable {
  transition: all $transition-fast;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

/* 卡片样式 */
.card {
  @include card;
}

/* 文本颜色 */
.text-primary {
  color: $color-primary !important;
}

.text-success {
  color: $color-success !important;
}

.text-warning {
  color: $color-warning !important;
}

.text-danger {
  color: $color-danger !important;
}

.text-secondary {
  color: $color-text-secondary !important;
}

.text-placeholder {
  color: $color-text-placeholder !important;
}

/* 字体大小 */
.text-h1 {
  font-size: $font-size-h1 !important;
}

.text-h2 {
  font-size: $font-size-h2 !important;
}

.text-h3 {
  font-size: $font-size-h3 !important;
}

.text-body {
  font-size: $font-size-body !important;
}

.text-caption {
  font-size: $font-size-caption !important;
}

.text-small {
  font-size: $font-size-small !important;
}

/* 字重 */
.font-bold {
  font-weight: $font-weight-bold !important;
}

.font-medium {
  font-weight: $font-weight-medium !important;
}

/* 间距工具类 */
.mt-xs {
  margin-top: $spacing-xs !important;
}

.mt-sm {
  margin-top: $spacing-sm !important;
}

.mt-md {
  margin-top: $spacing-md !important;
}

.mt-lg {
  margin-top: $spacing-lg !important;
}

.mb-xs {
  margin-bottom: $spacing-xs !important;
}

.mb-sm {
  margin-bottom: $spacing-sm !important;
}

.mb-md {
  margin-bottom: $spacing-md !important;
}

.mb-lg {
  margin-bottom: $spacing-lg !important;
}

.p-xs {
  padding: $spacing-xs !important;
}

.p-sm {
  padding: $spacing-sm !important;
}

.p-md {
  padding: $spacing-md !important;
}

.p-lg {
  padding: $spacing-lg !important;
}

/* Flex 布局 */
.flex {
  display: flex;
}

.flex-center {
  @include flex-center;
}

.flex-between {
  @include flex-between;
}

.flex-col {
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

/* 文本省略 */
.text-ellipsis {
  @include text-ellipsis(1);
}

.text-ellipsis-2 {
  @include text-ellipsis(2);
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
