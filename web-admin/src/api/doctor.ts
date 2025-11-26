import request from '@/utils/request';

export const doctorAPI = {
  // 创建医生
  create(data: any) {
    return request.post('/doctors', data);
  },

  // 获取医生列表
  getList(params?: any) {
    return request.get('/doctors', { params });
  },

  // 获取医生详情
  getDetail(id: number) {
    return request.get(`/doctors/${id}`);
  },

  // 更新医生信息
  update(id: number, data: any) {
    return request.put(`/doctors/${id}`, data);
  },

  // 更新医生状态
  updateStatus(id: number, status: string) {
    return request.patch(`/doctors/${id}/status`, { status });
  },

  // 删除医生
  delete(id: number) {
    return request.delete(`/doctors/${id}`);
  },
};
