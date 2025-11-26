import request from '@/utils/request';

export const patientAPI = {
  // 创建患者
  create(data: any) {
    return request.post('/patients', data);
  },

  // 获取患者列表
  getList(params?: any) {
    return request.get('/patients', { params });
  },

  // 获取患者详情
  getDetail(id: number) {
    return request.get(`/patients/${id}`);
  },

  // 更新患者信息
  update(id: number, data: any) {
    return request.put(`/patients/${id}`, data);
  },

  // 删除患者
  delete(id: number) {
    return request.delete(`/patients/${id}`);
  },
};
