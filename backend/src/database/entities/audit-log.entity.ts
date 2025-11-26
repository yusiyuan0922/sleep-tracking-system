import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StageRecord } from './stage-record.entity';
import { Doctor } from './doctor.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'stage_record_id', comment: '阶段记录ID' })
  stageRecordId: number;

  @ManyToOne(() => StageRecord)
  @JoinColumn({ name: 'stage_record_id' })
  stageRecord: StageRecord;

  @Column({ type: 'bigint', nullable: false, name: 'auditor_id', comment: '审核医生ID' })
  auditorId: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'auditor_id' })
  auditor: Doctor;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '审核操作:approve/reject',
  })
  action: 'approve' | 'reject';

  @Column({ type: 'text', nullable: true, comment: '审核意见' })
  remark: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'previous_status',
    comment: '审核前状态',
  })
  previousStatus: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'new_status',
    comment: '审核后状态',
  })
  newStatus: string;

  @CreateDateColumn({ name: 'created_at', comment: '审核时间' })
  createdAt: Date;
}
