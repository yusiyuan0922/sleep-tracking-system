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

/**
 * 量表中文名称映射
 */
export const SCALE_NAMES: Record<string, string> = {
  AIS: 'AIS量表(雅典失眠量表)',
  ESS: 'ESS量表(Epworth嗜睡量表)',
  GAD7: 'GAD7量表(广泛性焦虑障碍)',
  PHQ9: 'PHQ9量表(抑郁症筛查)',
  HAMA: 'HAMA量表(汉密尔顿焦虑)',
  HAMD: 'HAMD量表(汉密尔顿抑郁)',
};

/**
 * 获取阶段必填项的中文描述(用于推送消息)
 * @param stage 阶段名称 (V1/V2/V3/V4)
 * @returns 必填项描述数组
 */
export function getStageRequirementsDescription(stage: string): string[] {
  const requirements = STAGE_REQUIREMENTS[stage as keyof typeof STAGE_REQUIREMENTS];
  if (!requirements) return [];

  const items: string[] = [];

  // 患者量表
  requirements.patientScales?.forEach((scale) => {
    if (SCALE_NAMES[scale]) {
      items.push(SCALE_NAMES[scale]);
    }
  });

  // 医生量表
  requirements.doctorScales?.forEach((scale) => {
    if (SCALE_NAMES[scale]) {
      items.push(SCALE_NAMES[scale] + '(医生代填)');
    }
  });

  // 用药记录
  if (requirements.requiresMedicationRecord) {
    items.push('用药记录');
  }

  // 病历文件
  if (requirements.requiresMedicalFiles) {
    items.push('病历文件');
  }

  return items;
}
