import { get, post, put, del } from '../utils/request';

/**
 * 患者API
 */
export const patientAPI = {
  // 获取患者列表
  getList(params?: any) {
    return get('/patients', params);
  },

  // 获取当前患者信息
  getMyInfo() {
    return get('/patients/me');
  },

  // 注册患者
  register(data: any) {
    return post('/patients/register', data);
  },

  // 更新患者信息
  update(id: number, data: any) {
    return put(`/patients/${id}`, data);
  },

  // 获取患者详情
  getDetail(id: number) {
    return get(`/patients/${id}`);
  },

  // 获取患者阶段完成状态
  getStageCompletionStatus(id: number) {
    if (!id) {
      console.warn('getStageCompletionStatus: 患者ID为空，跳过请求');
      return Promise.resolve({});
    }
    return get(`/patients/${id}/stage-completion-status`);
  },

  // 完成V1阶段
  completeV1(id: number, data: any) {
    return post(`/patients/${id}/complete-v1`, data);
  },

  // 完成V2阶段
  completeV2(id: number, data: any) {
    return post(`/patients/${id}/complete-v2`, data);
  },

  // 完成V3阶段
  completeV3(id: number, data: any) {
    return post(`/patients/${id}/complete-v3`, data);
  },

  // 完成V4阶段
  completeV4(id: number, data: any) {
    return post(`/patients/${id}/complete-v4`, data);
  },

  // 患者提交当前阶段审核（只设置pendingReview，不推进阶段）
  submitForReview(id: number) {
    return post(`/patients/${id}/submit-for-review`);
  },
};

export default patientAPI;
