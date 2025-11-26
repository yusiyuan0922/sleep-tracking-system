import { get } from '../utils/request';

/**
 * 医院API
 */
export const hospitalAPI = {
  // 获取激活状态的医院列表（用于注册时选择）
  getActive() {
    return get('/hospitals/active');
  },

  // 获取医院列表
  getList(params?: any) {
    return get('/hospitals', params);
  },

  // 获取医院详情
  getDetail(id: number) {
    return get(`/hospitals/${id}`);
  },
};

export default hospitalAPI;
