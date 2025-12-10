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

  // 手动推进阶段
  advanceStage(id: number, targetStage: string, remark?: string) {
    return request.post(`/patients/${id}/advance-stage`, { targetStage, remark });
  },

  // 获取阶段完成状态
  getStageCompletionStatus(id: number) {
    return request.get(`/patients/${id}/stage-completion-status`);
  },

  // 完成V1阶段
  completeV1(id: number, data: any) {
    return request.post(`/patients/${id}/complete-v1`, data);
  },

  // 完成V2阶段
  completeV2(id: number, data: any) {
    return request.post(`/patients/${id}/complete-v2`, data);
  },

  // 完成V3阶段
  completeV3(id: number, data: any) {
    return request.post(`/patients/${id}/complete-v3`, data);
  },

  // 完成V4阶段
  completeV4(id: number) {
    return request.post(`/patients/${id}/complete-v4`);
  },

  // 检查提前退出条件
  checkWithdrawRequirements(id: number) {
    return request.get(`/patients/${id}/withdraw-check`);
  },

  // 患者提前退出
  withdrawPatient(id: number, reason: string) {
    return request.post(`/patients/${id}/withdraw`, { reason });
  },
};
