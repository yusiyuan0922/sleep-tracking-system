import request from '@/utils/request';

export const scaleAPI = {
  // ==================== 量表配置管理接口 ====================

  // 创建量表配置
  createConfig(data: any) {
    return request.post('/scales/configs', data);
  },

  // 获取量表配置列表
  getConfigList(params?: any) {
    return request.get('/scales/configs', { params });
  },

  // 获取量表配置详情
  getConfigDetail(id: number) {
    return request.get(`/scales/configs/${id}`);
  },

  // 根据代码获取量表配置
  getConfigByCode(code: string) {
    return request.get(`/scales/configs/code/${code}`);
  },

  // 更新量表配置
  updateConfig(id: number, data: any) {
    return request.put(`/scales/configs/${id}`, data);
  },

  // 删除量表配置
  deleteConfig(id: number) {
    return request.delete(`/scales/configs/${id}`);
  },

  // ==================== 量表记录管理接口 ====================

  // 提交量表记录
  submitRecord(data: any) {
    return request.post('/scales/records', data);
  },

  // 获取量表记录列表
  getRecordList(params?: any) {
    return request.get('/scales/records', { params });
  },

  // 获取量表记录详情
  getRecordDetail(id: number) {
    return request.get(`/scales/records/${id}`);
  },

  // 获取患者某个阶段的量表记录
  getPatientStageRecords(patientId: number, stage: string) {
    return request.get(`/scales/patients/${patientId}/stages/${stage}/records`);
  },
};
