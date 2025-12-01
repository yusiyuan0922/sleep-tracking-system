import { post } from '../utils/request';

/**
 * 微信登录
 */
export function wxLogin(code: string, phone?: string) {
  return post('/auth/wx-login', { code, phone });
}

/**
 * 医生账号密码登录
 */
export function doctorLogin(data: { username: string; password: string }) {
  return post('/auth/doctor-login', data);
}

/**
 * 认证API
 */
export const authAPI = {
  wxLogin,
  doctorLogin,
};

export default authAPI;
