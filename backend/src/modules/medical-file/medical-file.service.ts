import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import {
  CreateMedicalFileDto,
  UpdateMedicalFileDto,
  QueryMedicalFileDto,
} from './dto/medical-file.dto';

@Injectable()
export class MedicalFileService {
  constructor(
    @InjectRepository(MedicalFile)
    private medicalFileRepository: Repository<MedicalFile>,
  ) {}

  /**
   * 创建病历文件
   */
  async createMedicalFile(
    createMedicalFileDto: CreateMedicalFileDto,
  ): Promise<MedicalFile> {
    const file = this.medicalFileRepository.create(createMedicalFileDto);
    return await this.medicalFileRepository.save(file);
  }

  /**
   * 查询病历文件列表（支持分页和筛选）
   */
  async findAllMedicalFiles(query: QueryMedicalFileDto) {
    const { patientId, stage, fileCategory, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.medicalFileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user');

    if (patientId) {
      queryBuilder.andWhere('file.patientId = :patientId', { patientId });
    }

    if (stage) {
      queryBuilder.andWhere('file.stage = :stage', { stage });
    }

    if (fileCategory) {
      queryBuilder.andWhere('file.fileCategory = :fileCategory', {
        fileCategory,
      });
    }

    queryBuilder
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [files, total] = await queryBuilder.getManyAndCount();

    return {
      data: files,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取病历文件详情
   */
  async findOneMedicalFile(id: number): Promise<MedicalFile> {
    const file = await this.medicalFileRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user'],
    });

    if (!file) {
      throw new NotFoundException(`病历文件 ID ${id} 不存在`);
    }

    return file;
  }

  /**
   * 获取患者某个阶段的病历文件
   */
  async getPatientStageMedicalFiles(
    patientId: number,
    stage: string,
  ): Promise<MedicalFile[]> {
    return await this.medicalFileRepository.find({
      where: { patientId, stage: stage as any },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 更新病历文件
   */
  async updateMedicalFile(
    id: number,
    updateMedicalFileDto: UpdateMedicalFileDto,
  ): Promise<MedicalFile> {
    const file = await this.findOneMedicalFile(id);

    Object.assign(file, updateMedicalFileDto);

    return await this.medicalFileRepository.save(file);
  }

  /**
   * 删除病历文件
   */
  async removeMedicalFile(id: number): Promise<void> {
    const file = await this.findOneMedicalFile(id);
    await this.medicalFileRepository.remove(file);
  }
}
