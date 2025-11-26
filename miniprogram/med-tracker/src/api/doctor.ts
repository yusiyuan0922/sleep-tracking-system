import { get } from '../utils/request';

/**
 * 医生API
 */
export const doctorAPI = {
  // 获取医生列表（按医院筛选）
  getList(params: any) {
    return get('/doctors', params);
  },

  // 获取医生详情
  getDetail(id: number) {
    return get(`/doctors/${id}`);
  },

  // 获取当前医生信息
  getMyInfo() {
    return get('/doctors/me');
  },

  // 获取我的患者列表（医生端）
  getMyPatients(params?: any) {
    return get('/doctors/my-patients', params);
  },
};

export default doctorAPI;
