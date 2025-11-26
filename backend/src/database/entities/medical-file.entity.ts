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

@Entity('medical_files')
export class MedicalFile {
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

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'file_category',
    comment: '文件类别:informed_consent/medical_record/lab_report/other',
  })
  fileCategory: 'informed_consent' | 'medical_record' | 'lab_report' | 'other';

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '文件描述' })
  description: string;

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
