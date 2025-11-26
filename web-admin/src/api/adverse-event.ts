import request from '@/utils/request';

export const adverseEventAPI = {
  // 创建不良事件
  create(data: any) {
    return request.post('/adverse-events', data);
  },

  // 获取不良事件列表
  getList(params?: any) {
    return request.get('/adverse-events', { params });
  },

  // 获取不良事件详情
  getDetail(id: number) {
    return request.get(`/adverse-events/${id}`);
  },

  // 更新不良事件
  update(id: number, data: any) {
    return request.put(`/adverse-events/${id}`, data);
  },

  // 删除不良事件
  delete(id: number) {
    return request.delete(`/adverse-events/${id}`);
  },

  // 上传附件
  uploadAttachment(eventId: number, data: any) {
    return request.post(`/adverse-events/${eventId}/attachments`, data);
  },
};
