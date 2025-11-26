import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';

@Entity('stage_records')
export class StageRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'patient_id' })
  patientId: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: '阶段:V1/V2/V3/V4',
  })
  stage: 'V1' | 'V2' | 'V3' | 'V4';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'draft',
    comment: '状态:draft/submitted/approved/rejected',
  })
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at', comment: '提交时间' })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'audited_at', comment: '审核时间' })
  auditedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'audited_by', comment: '审核医生ID' })
  auditedBy: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'audited_by' })
  auditor: Doctor;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'audit_result',
    comment: '审核结果:approved/rejected',
  })
  auditResult: 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true, name: 'audit_remark', comment: '审核意见' })
  auditRemark: string;

  @Column({ type: 'text', nullable: true, name: 'reject_reason', comment: '驳回原因' })
  rejectReason: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
