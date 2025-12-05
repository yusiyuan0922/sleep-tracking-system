import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('scale_configs')
export class ScaleConfig {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
    comment: '量表代码:AIS/ESS/GAD7/PHQ9/HAMA/HAMD',
  })
  code: 'AIS' | 'ESS' | 'GAD7' | 'PHQ9' | 'HAMA' | 'HAMD';

  @Column({ type: 'varchar', length: 100, nullable: false, comment: '量表名称' })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '量表类型:self/doctor',
  })
  type: 'self' | 'doctor';

  @Column({ type: 'text', nullable: true, comment: '量表描述' })
  description: string;

  @Column({ type: 'int', nullable: true, name: 'total_items', comment: '题目总数' })
  totalItems: number;

  @Column({ type: 'int', nullable: true, name: 'max_score', comment: '最高分数' })
  maxScore: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '题目配置:[{question, options:[{label, value}]}]',
  })
  questions: {
    question: string;
    options: { label: string; value: number }[];
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'scoring_rules',
    comment: '评分规则:{ranges:[{min, max, level, description}]}',
  })
  scoringRules: {
    ranges: {
      min: number;
      max: number;
      level: string;
      description: string;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '适用阶段数组:["V1","V2","V3","V4"]',
  })
  stages: ('V1' | 'V2' | 'V3' | 'V4')[];

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'active',
    comment: '状态:active/inactive',
  })
  status: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
