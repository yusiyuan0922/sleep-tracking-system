import { formatErrorMessage } from './request';

/**
 * 显示成功提示
 */
export function showSuccess(message: string, duration: number = 1500) {
  uni.showToast({
    title: message,
    icon: 'success',
    duration,
  });
}

/**
 * 显示错误提示
 * 自动处理数组类型的错误消息
 */
export function showError(message: any, defaultMsg: string = '操作失败', duration: number = 2000) {
  uni.showToast({
    title: formatErrorMessage(message, defaultMsg),
    icon: 'none',
    duration,
  });
}

/**
 * 显示普通提示
 */
export function showInfo(message: string, duration: number = 2000) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration,
  });
}

/**
 * 显示加载中
 */
export function showLoading(message: string = '加载中...') {
  uni.showLoading({
    title: message,
    mask: true,
  });
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  uni.hideLoading();
}
