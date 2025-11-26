import { get, post, put, del } from '../utils/request';

/**
 * 用药记录API
 */
export const medicationAPI = {
  // 创建用药记录
  create(data: any) {
    return post('/medication-records', data);
  },

  // 获取用药记录列表
  getList(params: any) {
    return get('/medication-records', params);
  },

  // 获取用药记录详情
  getDetail(id: number) {
    return get(`/medication-records/${id}`);
  },

  // 更新用药记录
  update(id: number, data: any) {
    return put(`/medication-records/${id}`, data);
  },

  // 删除用药记录
  delete(id: number) {
    return del(`/medication-records/${id}`);
  },
};

export default medicationAPI;
