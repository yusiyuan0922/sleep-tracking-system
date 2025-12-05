import { get, post, put, del } from '../utils/request';

/**
 * 用药记录API
 */
export const medicationAPI = {
  // 创建用药记录
  createRecord(data: any) {
    return post('/medications/records', data);
  },

  // 获取用药记录列表
  getRecordList(params: any) {
    return get('/medications/records', params);
  },

  // 获取用药记录详情
  getRecordDetail(id: number) {
    return get(`/medications/records/${id}`);
  },

  // 更新用药记录
  updateRecord(id: number, data: any) {
    return put(`/medications/records/${id}`, data);
  },

  // 删除用药记录
  deleteRecord(id: number) {
    return del(`/medications/records/${id}`);
  },

  // 创建合并用药记录
  createConcomitant(data: any) {
    return post('/medications/concomitant', data);
  },

  // 获取合并用药列表
  getConcomitantList(params: any) {
    return get('/medications/concomitant', params);
  },

  // 获取合并用药详情
  getConcomitantDetail(id: number) {
    return get(`/medications/concomitant/${id}`);
  },

  // 更新合并用药
  updateConcomitant(id: number, data: any) {
    return put(`/medications/concomitant/${id}`, data);
  },

  // 删除合并用药
  deleteConcomitant(id: number) {
    return del(`/medications/concomitant/${id}`);
  },
};

export default medicationAPI;
