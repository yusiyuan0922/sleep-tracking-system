import request from '@/utils/request';

export const authAPI = {
  // 管理员登录
  adminLogin(data: { username: string; password: string }) {
    return request.post('/auth/admin-login', data);
  },

  // 微信登录（用于小程序）
  wxLogin(code: string) {
    return request.post('/auth/wx-login', { code });
  },
};
