import request from '@/utils/request';

export const medicationAPI = {
  // ==================== 用药记录管理接口 ====================

  // 创建用药记录
  createRecord(data: any) {
    return request.post('/medications/records', data);
  },

  // 获取用药记录列表
  getRecordList(params?: any) {
    return request.get('/medications/records', { params });
  },

  // 获取用药记录详情
  getRecordDetail(id: number) {
    return request.get(`/medications/records/${id}`);
  },

  // 更新用药记录
  updateRecord(id: number, data: any) {
    return request.put(`/medications/records/${id}`, data);
  },

  // 删除用药记录
  deleteRecord(id: number) {
    return request.delete(`/medications/records/${id}`);
  },

  // 获取患者某个阶段的用药记录
  getPatientStageRecords(patientId: number, stage: string) {
    return request.get(`/medications/patients/${patientId}/stages/${stage}/records`);
  },

  // ==================== 合并用药管理接口 ====================

  // 创建合并用药记录
  createConcomitant(data: any) {
    return request.post('/medications/concomitant', data);
  },

  // 获取合并用药记录列表
  getConcomitantList(params?: any) {
    return request.get('/medications/concomitant', { params });
  },

  // 获取合并用药记录详情
  getConcomitantDetail(id: number) {
    return request.get(`/medications/concomitant/${id}`);
  },

  // 更新合并用药记录
  updateConcomitant(id: number, data: any) {
    return request.put(`/medications/concomitant/${id}`, data);
  },

  // 删除合并用药记录
  deleteConcomitant(id: number) {
    return request.delete(`/medications/concomitant/${id}`);
  },

  // 获取患者某个阶段的合并用药记录
  getPatientStageConcomitant(patientId: number, stage: string) {
    return request.get(`/medications/patients/${patientId}/stages/${stage}/concomitant`);
  },
};
