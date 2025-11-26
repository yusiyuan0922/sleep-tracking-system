import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
    name: 'config_key',
    comment: '配置键',
  })
  configKey: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'config_name', comment: '配置名称' })
  configName: string;

  @Column({
    type: 'text',
    nullable: false,
    name: 'config_value',
    comment: '配置值',
  })
  configValue: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'string',
    comment: '值类型:string/number/boolean/json',
  })
  valueType: 'string' | 'number' | 'boolean' | 'json';

  @Column({ type: 'text', nullable: true, comment: '配置说明' })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '配置分组:system/wechat/oss/notification等',
  })
  category: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
    name: 'is_editable',
    comment: '是否可编辑',
  })
  isEditable: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
