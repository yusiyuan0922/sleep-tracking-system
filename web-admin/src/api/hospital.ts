import request from '@/utils/request';

export const hospitalAPI = {
  // 创建医院
  create(data: any) {
    return request.post('/hospitals', data);
  },

  // 获取医院列表
  getList(params?: any) {
    return request.get('/hospitals', { params });
  },

  // 获取激活状态的医院（下拉选择用）
  getActive() {
    return request.get('/hospitals/active');
  },

  // 获取医院详情
  getDetail(id: number) {
    return request.get(`/hospitals/${id}`);
  },

  // 更新医院信息
  update(id: number, data: any) {
    return request.put(`/hospitals/${id}`, data);
  },

  // 更新医院状态
  updateStatus(id: number, status: string) {
    return request.patch(`/hospitals/${id}/status`, { status });
  },

  // 删除医院
  delete(id: number) {
    return request.delete(`/hospitals/${id}`);
  },
};
