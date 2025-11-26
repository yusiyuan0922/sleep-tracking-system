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
import { ScaleConfig } from './scale-config.entity';

@Entity('scale_records')
export class ScaleRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'patient_id' })
  patientId: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'int', nullable: false, name: 'scale_id' })
  scaleId: number;

  @ManyToOne(() => ScaleConfig)
  @JoinColumn({ name: 'scale_id' })
  scale: ScaleConfig;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: '阶段:V1/V2/V3/V4',
  })
  stage: 'V1' | 'V2' | 'V3' | 'V4';

  @Column({
    type: 'jsonb',
    nullable: false,
    comment: '答案数组:[1,2,0,3,...]',
  })
  answers: number[];

  @Column({ type: 'int', nullable: false, name: 'total_score', comment: '总分' })
  totalScore: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '评级:正常/轻度/中度/重度等',
  })
  level: string;

  @Column({ type: 'text', nullable: true, comment: '评级说明' })
  description: string;

  @Column({
    type: 'timestamp',
    nullable: false,
    name: 'completed_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '完成时间',
  })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
