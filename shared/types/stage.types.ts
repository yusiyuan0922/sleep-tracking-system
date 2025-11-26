/**
 * 患者阶段枚举
 */
export enum PatientStage {
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
  V4 = 'V4',
  COMPLETED = 'completed',
}

/**
 * 阶段记录状态枚举
 */
export enum StageRecordStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * 审核结果枚举
 */
export enum AuditResult {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * 阶段记录接口
 */
export interface IStageRecord {
  id: number;
  patientId: number;
  stage: PatientStage;
  status: StageRecordStatus;
  submittedAt?: Date;
  auditedAt?: Date;
  auditedBy?: number;
  auditResult?: AuditResult;
  auditRemark?: string;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
