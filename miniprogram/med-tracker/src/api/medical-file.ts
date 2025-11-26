import { get, post, del } from '../utils/request';

/**
 * 病历文件API
 */
export const medicalFileAPI = {
  // 上传病历文件
  upload(data: any) {
    return post('/medical-files', data);
  },

  // 获取病历文件列表
  getList(params: any) {
    return get('/medical-files', params);
  },

  // 删除病历文件
  delete(id: number) {
    return del(`/medical-files/${id}`);
  },
};

export default medicalFileAPI;
