import { get, post, put, del } from '../utils/request';

/**
 * 量表API
 */
export const scaleAPI = {
  // 获取量表配置列表
  getConfigList() {
    return get('/scales/configs');
  },

  // 根据代码获取量表配置详情
  getDetail(code: string) {
    return get(`/scales/configs/code/${code}`);
  },

  // 提交量表记录
  submit(data: any) {
    return post('/scales/records', data);
  },

  // 获取患者量表记录
  getRecords(params: any) {
    return get('/scales/records', params);
  },

  // 获取量表记录详情
  getRecordDetail(id: number) {
    return get(`/scales/records/${id}`);
  },

  // 获取患者某个阶段的所有量表记录
  getPatientStageRecords(patientId: number, stage: string) {
    return get(`/scales/patients/${patientId}/stages/${stage}/records`);
  },
};

export default scaleAPI;
