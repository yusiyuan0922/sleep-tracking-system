import { get, post, put, del } from '../utils/request';

/**
 * 量表API
 */
export const scaleAPI = {
  // 获取量表列表
  getList() {
    return get('/scales');
  },

  // 获取量表详情
  getDetail(code: string) {
    return get(`/scales/${code}`);
  },

  // 提交量表记录
  submit(data: any) {
    return post('/scale-records', data);
  },

  // 获取患者量表记录
  getRecords(params: any) {
    return get('/scale-records', params);
  },

  // 获取量表记录详情
  getRecordDetail(id: number) {
    return get(`/scale-records/${id}`);
  },

  // 获取量表对比数据
  compare(params: any) {
    return get('/scale-records/compare', params);
  },
};

export default scaleAPI;
