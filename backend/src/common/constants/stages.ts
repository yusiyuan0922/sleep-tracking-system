/**
 * 阶段常量配置
 */
export const STAGE_CONFIG = {
  // V1到V2时间窗口(天)
  V1_TO_V2_DAYS: 7,
  V1_TO_V2_TOLERANCE: 1, // ±1天

  // V2到V3时间窗口(天)
  V2_TO_V3_DAYS: 21,
  V2_TO_V3_TOLERANCE: 2, // ±2天

  // V3到V4时间窗口(天)
  V3_TO_V4_DAYS: 7,
  V3_TO_V4_TOLERANCE: 2, // ±2天
};

/**
 * 各阶段必填项配置
 * 区分患者自填项和医生代填项
 */
export const STAGE_REQUIREMENTS = {
  V1: {
    // 患者必填项
    patientScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'], // 患者自填量表
    requiresMedicationRecord: true,
    requiresConcomitantMeds: false,

    // 医生必填项（审核时完成）
    doctorScales: ['HAMA', 'HAMD'], // 医生代填量表
    requiresMedicalFiles: false, // 病历文件非必填

    // 兼容旧代码：所有量表列表
    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'],
  },
  V2: {
    patientScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
    requiresMedicationRecord: true,
    requiresConcomitantMeds: false, // 合并用药可在阶段内随时填写,不作为必填项

    doctorScales: [],
    requiresMedicalFiles: false,

    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
  },
  V3: {
    patientScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
    requiresMedicationRecord: true,
    requiresConcomitantMeds: false,

    doctorScales: ['HAMA', 'HAMD'],
    requiresMedicalFiles: false, // 病历文件非必填

    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'],
  },
  V4: {
    patientScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
    requiresMedicationRecord: false,
    requiresConcomitantMeds: false, // 合并用药可在阶段内随时填写,不作为必填项

    doctorScales: [],
    requiresMedicalFiles: false,

    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
  },
};
