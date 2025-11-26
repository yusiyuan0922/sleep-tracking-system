<template>
  <view class="doctor-login-container">
    <view class="login-content">
      <!-- Logo和标题 -->
      <view class="header-section">
        <text class="app-icon">👨‍⚕️</text>
        <text class="app-title">医生端登录</text>
        <text class="app-subtitle">失眠患者用药跟踪系统</text>
      </view>

      <!-- 登录表单 -->
      <view class="form-section">
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">👤</text>
            <input
              class="input"
              v-model="formData.username"
              placeholder="请输入用户名或手机号"
              placeholder-class="placeholder"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input
              class="input"
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              placeholder-class="placeholder"
            />
          </view>
        </view>

        <button class="login-btn" @click="handleLogin" :loading="loading">
          登录
        </button>

        <view class="footer-links">
          <text class="link-text" @click="goToRegister">还没账号?立即注册</text>
        </view>
      </view>

      <!-- 微信授权登录 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <button class="wx-login-btn" @click="handleWxLogin">
        <text class="wx-icon">💬</text>
        <text>微信授权登录</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authAPI } from '../../api/auth';
import { config } from '../../config';

const loading = ref(false);

const formData = ref({
  username: '',
  password: '',
});

// 账号密码登录
const handleLogin = async () => {
  if (!formData.value.username) {
    uni.showToast({ title: '请输入用户名或手机号', icon: 'none' });
    return;
  }
  if (!formData.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }

  try {
    loading.value = true;

    const result = await authAPI.doctorLogin({
      username: formData.value.username,
      password: formData.value.password,
    });

    // 保存token和用户信息
    uni.setStorageSync(config.tokenKey, result.accessToken);
    uni.setStorageSync(config.userInfoKey, result.user);

    uni.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500,
    });

    // 跳转到医生端首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/doctor/index',
      });
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 微信授权登录
const handleWxLogin = async () => {
  try {
    loading.value = true;

    // 获取微信code
    const loginRes = await uni.login({
      provider: 'weixin',
    });

    if (loginRes[1].code) {
      const result = await authAPI.wxLogin(loginRes[1].code);

      // 保存token和用户信息
      uni.setStorageSync(config.tokenKey, result.accessToken);
      uni.setStorageSync(config.userInfoKey, result.user);

      // 检查用户角色
      if (result.user.role === 'doctor') {
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
        });

        setTimeout(() => {
          uni.switchTab({
            url: '/pages/doctor/index',
          });
        }, 1500);
      } else {
        uni.showToast({
          title: '该微信未绑定医生账号',
          icon: 'none',
        });

        // 清除存储
        uni.removeStorageSync(config.tokenKey);
        uni.removeStorageSync(config.userInfoKey);
      }
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 跳转到注册
const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/doctor/register',
  });
};
</script>

<style scoped>
.doctor-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
}

.login-content {
  width: 100%;
  max-width: 600rpx;
}

/* 头部 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.app-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 15rpx;
}

.app-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 表单 */
.form-section {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 30rpx;
  padding: 50rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 30rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 50rpx;
  padding: 0 30rpx;
  height: 90rpx;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.placeholder {
  color: #999999;
}

.login-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 40rpx;
}

.footer-links {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
}

.link-text {
  font-size: 26rpx;
  color: #667eea;
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  margin: 40rpx 0;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.divider-text {
  margin: 0 20rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 微信登录按钮 */
.wx-login-btn {
  width: 100%;
  height: 90rpx;
  background-color: rgba(255, 255, 255, 0.95);
  color: #333333;
  border-radius: 45rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.wx-icon {
  font-size: 36rpx;
}
</style>
