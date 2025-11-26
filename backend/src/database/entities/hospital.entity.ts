import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true, comment: '医院名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '省份' })
  province: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '城市' })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '详细地址' })
  address: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'contact_phone',
    comment: '联系电话',
  })
  contactPhone: string;

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
