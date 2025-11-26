import { get, post, put, del } from '../utils/request';

/**
 * 不良事件API
 */
export const adverseEventAPI = {
  // 创建不良事件
  create(data: any) {
    return post('/adverse-events', data);
  },

  // 获取不良事件列表
  getList(params: any) {
    return get('/adverse-events', params);
  },

  // 获取不良事件详情
  getDetail(id: number) {
    return get(`/adverse-events/${id}`);
  },

  // 更新不良事件
  update(id: number, data: any) {
    return put(`/adverse-events/${id}`, data);
  },

  // 删除不良事件
  delete(id: number) {
    return del(`/adverse-events/${id}`);
  },
};

export default adverseEventAPI;
