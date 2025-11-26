<template>
  <view class="login-container">
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-name">睡眠跟踪小程序</text>
      <text class="app-desc">失眠患者用药跟踪系统</text>
    </view>

    <view class="login-section">
      <button
        class="login-btn"
        type="primary"
        @click="handleWxLogin"
        :loading="loading"
      >
        <text class="btn-text">微信授权登录</text>
      </button>

      <view class="tips">
        <text class="tips-text">点击授权登录即表示同意</text>
        <text class="tips-link">《用户协议》</text>
        <text class="tips-text">和</text>
        <text class="tips-link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authAPI } from '@/api/auth';
import config from '@/config';

const loading = ref(false);

// 微信登录
const handleWxLogin = async () => {
  try {
    loading.value = true;

    // 1. 获取微信登录code
    const loginRes = await uni.login({
      provider: 'weixin',
    });

    if (loginRes[1].code) {
      // 2. 调用后端登录接口
      const result = await authAPI.wxLogin(loginRes[1].code);

      // 3. 保存token和用户信息
      uni.setStorageSync(config.tokenKey, result.accessToken);
      uni.setStorageSync(config.userInfoKey, result.user);

      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      });

      // 4. 跳转到首页
      setTimeout(() => {
        if (result.user.role === 'patient' && !result.user.patientId) {
          // 患者未注册,跳转到注册页
          uni.reLaunch({
            url: '/pages/register/patient',
          });
        } else {
          // 已注册,跳转到首页
          uni.switchTab({
            url: '/pages/index/index',
          });
        }
      }, 1500);
    } else {
      throw new Error('获取微信登录code失败');
    }
  } catch (error: any) {
    console.error('登录失败:', error);
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
      duration: 2000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 120rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
}

.app-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-btn {
  width: 100%;
  height: 100rpx;
  background-color: #ffffff;
  color: #667eea;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  color: #667eea;
}

.tips {
  margin-top: 60rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.tips-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.tips-link {
  font-size: 24rpx;
  color: #ffffff;
  text-decoration: underline;
}
</style>
