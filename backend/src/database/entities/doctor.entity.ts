import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Hospital } from './hospital.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', unique: true, nullable: false, name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: false, name: 'hospital_id' })
  hospitalId: number;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'employee_no', comment: '工号' })
  employeeNo: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '科室' })
  department: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '职称' })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'qualification_cert_url',
    comment: '资质证明文件URL',
  })
  qualificationCertUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'pending',
    name: 'audit_status',
    comment: '审核状态:pending/approved/rejected',
  })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true, name: 'audit_remark', comment: '审核备注' })
  auditRemark: string;

  @Column({ type: 'timestamp', nullable: true, name: 'audited_at', comment: '审核时间' })
  auditedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'audited_by', comment: '审核人ID' })
  auditedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'audited_by' })
  auditor: User;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
