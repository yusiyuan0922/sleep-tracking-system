/**
 * 量表代码枚举
 */
export enum ScaleCode {
  AIS = 'AIS',
  ESS = 'ESS',
  GAD7 = 'GAD7',
  PHQ9 = 'PHQ9',
  HAMA = 'HAMA',
  HAMD = 'HAMD',
}

/**
 * 量表类型枚举
 */
export enum ScaleType {
  SELF = 'self', // 患者自评
  DOCTOR = 'doctor', // 医生代填
}

/**
 * 量表基本信息
 */
export const SCALE_INFO = {
  [ScaleCode.AIS]: {
    name: '雅典失眠量表',
    type: ScaleType.SELF,
    totalItems: 8,
    maxScore: 24,
  },
  [ScaleCode.ESS]: {
    name: 'Epworth嗜睡量表',
    type: ScaleType.SELF,
    totalItems: 8,
    maxScore: 24,
  },
  [ScaleCode.GAD7]: {
    name: '广泛性焦虑量表',
    type: ScaleType.SELF,
    totalItems: 7,
    maxScore: 21,
  },
  [ScaleCode.PHQ9]: {
    name: '患者健康问卷抑郁量表',
    type: ScaleType.SELF,
    totalItems: 9,
    maxScore: 27,
  },
  [ScaleCode.HAMA]: {
    name: '汉密尔顿焦虑量表',
    type: ScaleType.DOCTOR,
    totalItems: 14,
    maxScore: 56,
  },
  [ScaleCode.HAMD]: {
    name: '汉密尔顿抑郁量表',
    type: ScaleType.DOCTOR,
    totalItems: 24,
    maxScore: 76, // 复杂评分
  },
};
