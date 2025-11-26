import request from '@/utils/request';

export const medicalFileAPI = {
  // 创建病历文件
  create(data: any) {
    return request.post('/medical-files', data);
  },

  // 获取病历文件列表
  getList(params?: any) {
    return request.get('/medical-files', { params });
  },

  // 获取病历文件详情
  getDetail(id: number) {
    return request.get(`/medical-files/${id}`);
  },

  // 更新病历文件
  update(id: number, data: any) {
    return request.put(`/medical-files/${id}`, data);
  },

  // 删除病历文件
  delete(id: number) {
    return request.delete(`/medical-files/${id}`);
  },
};
