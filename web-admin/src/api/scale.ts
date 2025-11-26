import request from '@/utils/request';

export const scaleAPI = {
  // 创建量表
  create(data: any) {
    return request.post('/scales', data);
  },

  // 获取量表列表
  getList(params?: any) {
    return request.get('/scales', { params });
  },

  // 获取量表详情
  getDetail(id: number) {
    return request.get(`/scales/${id}`);
  },

  // 更新量表
  update(id: number, data: any) {
    return request.put(`/scales/${id}`, data);
  },

  // 更新量表状态
  updateStatus(id: number, status: string) {
    return request.patch(`/scales/${id}/status`, { status });
  },

  // 删除量表
  delete(id: number) {
    return request.delete(`/scales/${id}`);
  },
};
