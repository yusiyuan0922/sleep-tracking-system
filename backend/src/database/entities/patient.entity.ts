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
import { Doctor } from './doctor.entity';
import { Hospital } from './hospital.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', unique: true, nullable: false, name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
    name: 'patient_no',
    comment: '患者编号(自动生成)',
  })
  patientNo: string;

  @Column({ type: 'bigint', nullable: false, name: 'doctor_id', comment: '主治医生ID' })
  doctorId: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'int', nullable: false, name: 'hospital_id', comment: '就诊医院ID' })
  hospitalId: number;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'emergency_contact', comment: '紧急联系人' })
  emergencyContact: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_phone', comment: '紧急联系电话' })
  emergencyPhone: string;

  @Column({ type: 'text', nullable: true, comment: '诊断信息' })
  diagnosis: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: 'V1',
    name: 'current_stage',
    comment: '当前阶段:V1/V2/V3/V4/completed',
  })
  currentStage: 'V1' | 'V2' | 'V3' | 'V4' | 'completed';

  @Column({
    type: 'date',
    nullable: false,
    name: 'enrollment_date',
    default: () => 'CURRENT_DATE',
    comment: '入组日期',
  })
  enrollmentDate: Date;

  // V1 完成时间
  @Column({ type: 'timestamp', nullable: true, name: 'v1_completed_at' })
  v1CompletedAt: Date;

  // V2 时间窗口
  @Column({ type: 'date', nullable: true, name: 'v2_window_start', comment: 'V2时间窗口开始' })
  v2WindowStart: Date;

  @Column({ type: 'date', nullable: true, name: 'v2_window_end', comment: 'V2时间窗口结束' })
  v2WindowEnd: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'v2_completed_at' })
  v2CompletedAt: Date;

  // V3 时间窗口
  @Column({ type: 'date', nullable: true, name: 'v3_window_start', comment: 'V3时间窗口开始' })
  v3WindowStart: Date;

  @Column({ type: 'date', nullable: true, name: 'v3_window_end', comment: 'V3时间窗口结束' })
  v3WindowEnd: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'v3_completed_at' })
  v3CompletedAt: Date;

  // V4 时间窗口
  @Column({ type: 'date', nullable: true, name: 'v4_window_start', comment: 'V4时间窗口开始' })
  v4WindowStart: Date;

  @Column({ type: 'date', nullable: true, name: 'v4_window_end', comment: 'V4时间窗口结束' })
  v4WindowEnd: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'v4_completed_at' })
  v4CompletedAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'active',
    comment: '状态:active/completed/withdrawn',
  })
  status: 'active' | 'completed' | 'withdrawn';

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'pending_review',
    comment: '是否等待医生审核',
  })
  pendingReview: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
