<template>
  <view class="bind-phone-container">
    <view class="header">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">绑定手机号</text>
      <text class="desc">请输入管理员为您创建账号时使用的手机号</text>
    </view>

    <view class="form-container">
      <view class="input-group">
        <text class="label">手机号</text>
        <input
          class="input"
          v-model="phone"
          placeholder="请输入11位手机号"
          type="number"
          maxlength="11"
        />
      </view>

      <button
        class="bind-btn"
        @click="handleBind"
        :loading="loading"
        :disabled="!isPhoneValid"
      >
        <text class="btn-text">{{ loading ? '绑定中...' : '确认绑定' }}</text>
      </button>

      <view class="tips">
        <text class="tips-text">提示:如果您是管理员创建的医生账号,请输入您的手机号进行绑定</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { authAPI } from '@/api/auth';
import config from '@/config';
import { formatErrorMessage } from '@/utils/request';

const phone = ref('');
const loading = ref(false);

// 验证手机号格式
const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value);
});

// 绑定手机号
const handleBind = async () => {
  if (!isPhoneValid.value) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    });
    return;
  }

  try {
    loading.value = true;

    // 1. 获取微信登录code
    const loginRes = await uni.login({
      provider: 'weixin',
    });

    if (loginRes.code) {
      // 2. 调用后端登录接口,带上手机号
      const result = await authAPI.wxLogin(loginRes.code, phone.value);

      // 3. 检查是否绑定成功
      if (result.user.role === 'doctor' && result.user.doctorId) {
        // 绑定成功,保存token和用户信息
        uni.setStorageSync(config.tokenKey, result.accessToken);
        uni.setStorageSync(config.userInfoKey, result.user);

        console.log('✅ 医生绑定成功，保存的用户信息:', result.user);
        console.log('用户角色:', result.user.role);

        uni.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 1500,
        });

        // 跳转到医生端首页（使用 reLaunch 隐藏患者端 TabBar）
        setTimeout(() => {
          console.log('准备跳转到医生端首页');
          uni.reLaunch({
            url: '/pages/doctor/index',
          });
        }, 1500);
      } else {
        // 绑定失败,手机号不匹配
        uni.showToast({
          title: '手机号不匹配,请联系管理员',
          icon: 'none',
          duration: 2000,
        });
      }
    } else {
      throw new Error('获取微信登录code失败');
    }
  } catch (error: any) {
    console.error('绑定失败:', error);
    uni.showToast({
      title: formatErrorMessage(error.message, '绑定失败'),
      icon: 'none',
      duration: 2000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.bind-phone-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 120rpx;
  margin-bottom: 80rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
}

.desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 40rpx;
  padding: 0 40rpx;
}

.form-container {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
}

.input-group {
  margin-bottom: 60rpx;
}

.label {
  display: block;
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 90rpx;
  padding: 0 30rpx;
  background-color: #f7f8fa;
  border-radius: 10rpx;
  font-size: 32rpx;
  color: #333333;
}

.bind-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 50rpx;
  font-size: 36rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.bind-btn[disabled] {
  opacity: 0.6;
}

.btn-text {
  color: #ffffff;
}

.tips {
  padding: 0 20rpx;
}

.tips-text {
  font-size: 24rpx;
  color: #999999;
  line-height: 36rpx;
  text-align: center;
  display: block;
}
</style>
