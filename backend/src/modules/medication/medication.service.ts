import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import {
  CreateMedicationRecordDto,
  UpdateMedicationRecordDto,
  QueryMedicationRecordDto,
  CreateConcomitantMedicationDto,
  UpdateConcomitantMedicationDto,
  QueryConcomitantMedicationDto,
} from './dto/medication.dto';

@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(MedicationRecord)
    private medicationRecordRepository: Repository<MedicationRecord>,
    @InjectRepository(ConcomitantMedication)
    private concomitantMedicationRepository: Repository<ConcomitantMedication>,
  ) {}

  // ==================== 用药记录管理 ====================

  /**
   * 创建用药记录
   */
  async createMedicationRecord(
    createMedicationRecordDto: CreateMedicationRecordDto,
  ): Promise<MedicationRecord> {
    const record = this.medicationRecordRepository.create(createMedicationRecordDto);
    return await this.medicationRecordRepository.save(record);
  }

  /**
   * 查询用药记录列表（支持分页和筛选）
   */
  async findAllMedicationRecords(query: QueryMedicationRecordDto) {
    const { patientId, stage, drugName, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.medicationRecordRepository
      .createQueryBuilder('medication')
      .leftJoinAndSelect('medication.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user');

    if (patientId) {
      queryBuilder.andWhere('medication.patientId = :patientId', { patientId });
    }

    if (stage) {
      queryBuilder.andWhere('medication.stage = :stage', { stage });
    }

    if (drugName) {
      queryBuilder.andWhere('medication.drugName LIKE :drugName', {
        drugName: `%${drugName}%`,
      });
    }

    queryBuilder
      .orderBy('medication.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [records, total] = await queryBuilder.getManyAndCount();

    // 格式化返回数据，将字段名映射为前端期望的格式
    const list = records.map(record => ({
      id: record.id,
      medicationName: record.drugName,
      stage: record.stage,
      dosage: record.dosage,
      unit: record.unit,
      frequency: record.frequency,
      route: record.route,
      startDate: record.startDate,
      endDate: record.endDate,
      duration: record.duration,
      indication: record.indication,
      remark: record.remark,
      createdAt: record.createdAt,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取用药记录详情
   */
  async findOneMedicationRecord(id: number): Promise<MedicationRecord> {
    const record = await this.medicationRecordRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user'],
    });

    if (!record) {
      throw new NotFoundException(`用药记录 ID ${id} 不存在`);
    }

    return record;
  }

  /**
   * 获取患者某个阶段的用药记录
   */
  async getPatientStageMedicationRecords(
    patientId: number,
    stage: string,
  ): Promise<MedicationRecord[]> {
    return await this.medicationRecordRepository.find({
      where: { patientId, stage: stage as any },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 更新用药记录
   */
  async updateMedicationRecord(
    id: number,
    updateMedicationRecordDto: UpdateMedicationRecordDto,
  ): Promise<MedicationRecord> {
    const record = await this.findOneMedicationRecord(id);

    Object.assign(record, updateMedicationRecordDto);

    return await this.medicationRecordRepository.save(record);
  }

  /**
   * 删除用药记录
   */
  async removeMedicationRecord(id: number): Promise<void> {
    const record = await this.findOneMedicationRecord(id);
    await this.medicationRecordRepository.remove(record);
  }

  // ==================== 合并用药管理 ====================

  /**
   * 创建合并用药记录
   */
  async createConcomitantMedication(
    createConcomitantMedicationDto: CreateConcomitantMedicationDto,
  ): Promise<ConcomitantMedication> {
    // V1阶段不需要合并用药
    if (createConcomitantMedicationDto.stage === 'V1' as any) {
      throw new BadRequestException('V1阶段不需要记录合并用药');
    }

    const record = this.concomitantMedicationRepository.create(
      createConcomitantMedicationDto,
    );
    return await this.concomitantMedicationRepository.save(record);
  }

  /**
   * 查询合并用药记录列表（支持分页和筛选）
   */
  async findAllConcomitantMedications(query: QueryConcomitantMedicationDto) {
    const { patientId, stage, drugName, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.concomitantMedicationRepository
      .createQueryBuilder('concomitant')
      .leftJoinAndSelect('concomitant.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user');

    if (patientId) {
      queryBuilder.andWhere('concomitant.patientId = :patientId', { patientId });
    }

    if (stage) {
      queryBuilder.andWhere('concomitant.stage = :stage', { stage });
    }

    if (drugName) {
      queryBuilder.andWhere('concomitant.drugName LIKE :drugName', {
        drugName: `%${drugName}%`,
      });
    }

    queryBuilder
      .orderBy('concomitant.startDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [records, total] = await queryBuilder.getManyAndCount();

    return {
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取合并用药记录详情
   */
  async findOneConcomitantMedication(id: number): Promise<ConcomitantMedication> {
    const record = await this.concomitantMedicationRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user'],
    });

    if (!record) {
      throw new NotFoundException(`合并用药记录 ID ${id} 不存在`);
    }

    return record;
  }

  /**
   * 获取患者某个阶段的合并用药记录
   */
  async getPatientStageConcomitantMedications(
    patientId: number,
    stage: string,
  ): Promise<ConcomitantMedication[]> {
    return await this.concomitantMedicationRepository.find({
      where: { patientId, stage: stage as any },
      order: { startDate: 'DESC' },
    });
  }

  /**
   * 更新合并用药记录
   */
  async updateConcomitantMedication(
    id: number,
    updateConcomitantMedicationDto: UpdateConcomitantMedicationDto,
  ): Promise<ConcomitantMedication> {
    const record = await this.findOneConcomitantMedication(id);

    Object.assign(record, updateConcomitantMedicationDto);

    return await this.concomitantMedicationRepository.save(record);
  }

  /**
   * 删除合并用药记录
   */
  async removeConcomitantMedication(id: number): Promise<void> {
    const record = await this.findOneConcomitantMedication(id);
    await this.concomitantMedicationRepository.remove(record);
  }
}
