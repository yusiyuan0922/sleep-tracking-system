import request from '@/utils/request';

/**
 * 导出筛选条件
 */
export interface ExportFilter {
  hospitalId?: number;
  doctorId?: number;
  patientId?: number;
  stage?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 量表导出筛选条件
 */
export interface ExportScaleFilter extends ExportFilter {
  scaleCode?: string;
}

/**
 * 不良事件导出筛选条件
 */
export interface ExportAdverseEventFilter extends ExportFilter {
  severity?: string;
  isSerious?: boolean;
}

/**
 * 导出 API
 */
export const exportAPI = {
  // ==================== 医院维度导出 ====================

  /**
   * 导出医院患者汇总
   */
  exportHospitalSummary(data: { hospitalId?: number }) {
    return request.post('/export/hospital-summary', data, {
      responseType: 'blob',
    });
  },

  // ==================== 医生维度导出 ====================

  /**
   * 导出医生工作量统计
   */
  exportDoctorSummary(data: { hospitalId?: number; doctorId?: number }) {
    return request.post('/export/doctor-summary', data, {
      responseType: 'blob',
    });
  },

  // ==================== 患者维度导出 ====================

  /**
   * 导出患者列表
   */
  exportPatients(data: ExportFilter) {
    return request.post('/export/patients', data, {
      responseType: 'blob',
    });
  },

  /**
   * 导出单患者完整档案
   */
  exportPatientProfile(patientId: number) {
    return request.post(`/export/patient-profile/${patientId}`, {}, {
      responseType: 'blob',
    });
  },

  /**
   * 导出量表记录
   */
  exportScaleRecords(data: ExportScaleFilter) {
    return request.post('/export/scale-records', data, {
      responseType: 'blob',
    });
  },

  /**
   * 导出用药记录
   */
  exportMedicationRecords(data: ExportFilter) {
    return request.post('/export/medication-records', data, {
      responseType: 'blob',
    });
  },

  /**
   * 导出不良事件
   */
  exportAdverseEvents(data: ExportAdverseEventFilter) {
    return request.post('/export/adverse-events', data, {
      responseType: 'blob',
    });
  },

  // ==================== 统计报表导出 ====================

  /**
   * 导出Dashboard统计数据
   */
  exportDashboardStats() {
    return request.post('/export/dashboard-stats', {}, {
      responseType: 'blob',
    });
  },
};

/**
 * 下载文件工具函数
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放内存
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

/**
 * 生成带时间戳的文件名
 */
export const generateFilename = (prefix: string) => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}_${timestamp}.xlsx`;
};
