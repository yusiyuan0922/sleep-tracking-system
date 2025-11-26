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
 */
export const STAGE_REQUIREMENTS = {
  V1: {
    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'],
    requiresMedicalFiles: true,
    requiresMedicationRecord: true,
    requiresConcomitantMeds: false,
  },
  V2: {
    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
    requiresMedicalFiles: false,
    requiresMedicationRecord: true,
    requiresConcomitantMeds: true,
  },
  V3: {
    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'],
    requiresMedicalFiles: true,
    requiresMedicationRecord: true,
    requiresConcomitantMeds: false,
  },
  V4: {
    requiredScales: ['AIS', 'ESS', 'GAD7', 'PHQ9'],
    requiresMedicalFiles: false,
    requiresMedicationRecord: false,
    requiresConcomitantMeds: true,
  },
};
