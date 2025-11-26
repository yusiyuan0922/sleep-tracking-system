import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'user_id', comment: '操作用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '操作模块:user/patient/stage/scale/medication/ae等',
  })
  module: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '操作类型:create/update/delete/approve/reject/login等',
  })
  action: string;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '操作描述' })
  description: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '操作详情:{entityId, entityType, changes, etc}',
  })
  details: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address', comment: 'IP地址' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent', comment: '用户代理' })
  userAgent: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
    comment: '是否成功',
  })
  success: boolean;

  @Column({ type: 'text', nullable: true, name: 'error_message', comment: '错误信息(失败时)' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at', comment: '操作时间' })
  createdAt: Date;
}
