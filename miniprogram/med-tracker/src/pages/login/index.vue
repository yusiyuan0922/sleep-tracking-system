<template>
  <view class="login-container">
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-name">睡眠跟踪小程序</text>
      <text class="app-desc">失眠患者用药跟踪系统</text>
    </view>

    <view class="login-section">
      <button
        class="login-btn patient"
        type="primary"
        @click="handleWxLogin('patient')"
        :loading="loading && loginType === 'patient'"
      >
        <text class="btn-text">患者登录</text>
      </button>

      <button
        class="login-btn doctor"
        type="default"
        @click="handleWxLogin('doctor')"
        :loading="loading && loginType === 'doctor'"
      >
        <text class="btn-text doctor-text">医生登录</text>
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
import { formatErrorMessage } from '@/utils/request';

const loading = ref(false);
const loginType = ref<'patient' | 'doctor'>('patient');

// 微信登录
const handleWxLogin = async (type: 'patient' | 'doctor') => {
  try {
    loading.value = true;
    loginType.value = type;

    // 如果是医生登录，先跳转到绑定手机号页面
    if (type === 'doctor') {
      uni.reLaunch({
        url: '/pages/bind-phone/index',
      });
      return;
    }

    // 患者登录流程
    // 1. 获取微信登录code
    const loginRes = await uni.login({
      provider: 'weixin',
    });

    if (loginRes.code) {
      // 2. 调用后端登录接口
      const result = await authAPI.wxLogin(loginRes.code);

      // 3. 保存token和用户信息
      uni.setStorageSync(config.tokenKey, result.accessToken);
      uni.setStorageSync(config.userInfoKey, result.user);

      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      });

      // 4. 根据用户角色跳转到对应页面
      setTimeout(() => {
        if (result.user.role === 'doctor') {
          // 医生角色，跳转到首页（首页会显示医生端界面）
          uni.switchTab({
            url: '/pages/index/index',
          });
        } else if (result.user.role === 'patient' && !result.user.patientId) {
          // 患者未注册,跳转到注册页
          uni.reLaunch({
            url: '/pages/register/patient',
          });
        } else {
          // 已注册患者,跳转到首页
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
      title: formatErrorMessage(error.message, '登录失败'),
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
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.login-btn.patient {
  background-color: #ffffff;
  color: #667eea;
}

.login-btn.doctor {
  background-color: rgba(255, 255, 255, 0.2);
  border: 2rpx solid #ffffff;
  color: #ffffff;
}

.btn-text {
  color: #667eea;
}

.doctor-text {
  color: #ffffff;
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
