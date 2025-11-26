import request from '@/utils/request';

export const stageRecordAPI = {
  // 创建阶段记录
  create(data: any) {
    return request.post('/stage-records', data);
  },

  // 获取阶段记录列表
  getList(params?: any) {
    return request.get('/stage-records', { params });
  },

  // 获取阶段记录详情
  getDetail(id: number) {
    return request.get(`/stage-records/${id}`);
  },

  // 提交阶段记录
  submit(id: number) {
    return request.post(`/stage-records/${id}/submit`);
  },

  // 审核阶段记录
  audit(id: number, data: any) {
    return request.post(`/stage-records/${id}/audit`, data);
  },

  // 删除阶段记录
  delete(id: number) {
    return request.delete(`/stage-records/${id}`);
  },
};
