import request from '@/utils/request';

export const medicationAPI = {
  // 创建用药记录
  create(data: any) {
    return request.post('/medications', data);
  },

  // 获取用药记录列表
  getList(params?: any) {
    return request.get('/medications', { params });
  },

  // 获取用药记录详情
  getDetail(id: number) {
    return request.get(`/medications/${id}`);
  },

  // 更新用药记录
  update(id: number, data: any) {
    return request.put(`/medications/${id}`, data);
  },

  // 删除用药记录
  delete(id: number) {
    return request.delete(`/medications/${id}`);
  },
};
