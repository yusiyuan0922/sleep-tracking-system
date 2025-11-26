import config from '../config';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: any;
  timeout?: number;
}

interface Response<T = any> {
  data: T;
  statusCode: number;
  header: any;
  errMsg: string;
}

/**
 * 封装的请求方法
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = uni.getStorageSync(config.tokenKey);

    // 合并请求头
    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    };

    // 如果有token,添加到请求头
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    // 发起请求
    uni.request({
      url: config.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || config.timeout,
      success: (res: Response) => {
        // 请求成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else if (res.statusCode === 401) {
          // token过期或未授权
          uni.removeStorageSync(config.tokenKey);
          uni.removeStorageSync(config.userInfoKey);
          uni.showToast({
            title: '登录已过期,请重新登录',
            icon: 'none',
            duration: 2000,
          });
          // 跳转到登录页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/index',
            });
          }, 2000);
          reject(new Error('Unauthorized'));
        } else {
          // 其他错误
          const errorMsg = (res.data as any)?.message || '请求失败';
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000,
          });
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        // 请求失败
        console.error('Request failed:', err);
        uni.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000,
        });
        reject(err);
      },
    });
  });
}

/**
 * GET请求
 */
export function get<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    data: params,
  });
}

/**
 * POST请求
 */
export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
}

/**
 * PUT请求
 */
export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data,
  });
}

/**
 * DELETE请求
 */
export function del<T = any>(url: string): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
  });
}

/**
 * PATCH请求
 */
export function patch<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: 'PATCH',
    data,
  });
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
  patch,
};
