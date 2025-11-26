import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdverseEvent } from './adverse-event.entity';

@Entity('ae_attachments')
export class AeAttachment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false, name: 'ae_id', comment: '不良事件ID' })
  aeId: number;

  @ManyToOne(() => AdverseEvent)
  @JoinColumn({ name: 'ae_id' })
  adverseEvent: AdverseEvent;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    name: 'file_type',
    comment: '文件类型:image/pdf/doc等',
  })
  fileType: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'file_name', comment: '原始文件名' })
  fileName: string;

  @Column({ type: 'varchar', length: 500, nullable: false, name: 'file_url', comment: 'OSS文件URL' })
  fileUrl: string;

  @Column({ type: 'bigint', nullable: false, name: 'file_size', comment: '文件大小(字节)' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at', comment: '上传时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
