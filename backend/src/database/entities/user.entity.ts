import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 128, unique: true, nullable: false })
  openid: string;

  @Column({ type: 'varchar', length: 128, unique: true, nullable: true })
  unionid: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '角色:admin/doctor/patient',
  })
  role: 'admin' | 'doctor' | 'patient';

  @Column({ type: 'varchar', length: 50, nullable: false, comment: '姓名' })
  name: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '性别:male/female',
  })
  gender: 'male' | 'female';

  @Column({ type: 'date', nullable: true, name: 'birth_date', comment: '出生日期' })
  birthDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '手机号(加密存储)',
  })
  phone: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'avatar_url',
    comment: '头像URL',
  })
  avatarUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'active',
    comment: '状态:active/inactive/deleted',
  })
  status: 'active' | 'inactive' | 'deleted';

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
