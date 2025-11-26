import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('push_messages')
export class PushMessage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'user_id', comment: '接收用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '消息类型:stage_reminder/audit_result/ae_alert/system_notice',
  })
  type: 'stage_reminder' | 'audit_result' | 'ae_alert' | 'system_notice';

  @Column({ type: 'varchar', length: 200, nullable: false, comment: '消息标题' })
  title: string;

  @Column({ type: 'text', nullable: false, comment: '消息内容' })
  content: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '扩展数据:{stageRecordId, aeId, etc}',
  })
  data: Record<string, any>;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_read',
    comment: '是否已读',
  })
  isRead: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'read_at',
    comment: '阅读时间',
  })
  readAt: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
