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

@Entity('medication_records')
export class MedicationRecord {
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

  @Column({ type: 'varchar', length: 100, nullable: false, name: 'drug_name', comment: '药品名称' })
  drugName: string;

  @Column({ type: 'varchar', length: 50, nullable: false, comment: '规格:如10mg/片' })
  specification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, comment: '每次剂量' })
  dosage: number;

  @Column({ type: 'varchar', length: 20, nullable: false, comment: '剂量单位:mg/片/粒等' })
  unit: string;

  @Column({ type: 'varchar', length: 50, nullable: false, comment: '用药频率:每日1次/每日2次等' })
  frequency: string;

  @Column({ type: 'varchar', length: 50, nullable: false, comment: '用药途径:口服/注射等' })
  route: string;

  @Column({ type: 'date', nullable: false, name: 'start_date', comment: '开始日期' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date', comment: '结束日期' })
  endDate: Date;

  @Column({
    type: 'int',
    nullable: true,
    comment: '用药天数(由trigger自动计算)',
  })
  duration: number;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
