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

@Entity('adverse_events')
export class AdverseEvent {
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

  @Column({ type: 'varchar', length: 100, nullable: false, name: 'event_name', comment: '不良事件名称' })
  eventName: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '严重程度:mild/moderate/severe',
  })
  severity: 'mild' | 'moderate' | 'severe';

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_serious',
    comment: '是否严重不良事件(SAE)',
  })
  isSerious: boolean;

  @Column({
    type: 'timestamp',
    nullable: false,
    name: 'onset_date',
    comment: '发生时间',
  })
  onsetDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'end_date',
    comment: '结束时间',
  })
  endDate: Date;

  @Column({ type: 'text', nullable: false, comment: '详细描述' })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'related_drug',
    comment: '可能相关药物',
  })
  relatedDrug: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '因果关系:definite/probable/possible/unlikely/unrelated',
  })
  causality: 'definite' | 'probable' | 'possible' | 'unlikely' | 'unrelated';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '采取措施:none/dose_reduced/drug_stopped/treatment_given',
  })
  action: 'none' | 'dose_reduced' | 'drug_stopped' | 'treatment_given';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '结果:recovered/recovering/not_recovered/fatal/unknown',
  })
  outcome: 'recovered' | 'recovering' | 'not_recovered' | 'fatal' | 'unknown';

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
