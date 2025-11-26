import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StageRecord } from '../../database/entities/stage-record.entity';
import {
  CreateStageRecordDto,
  SubmitStageRecordDto,
  AuditStageRecordDto,
  QueryStageRecordDto,
} from './dto/stage-record.dto';

@Injectable()
export class StageRecordService {
  constructor(
    @InjectRepository(StageRecord)
    private stageRecordRepository: Repository<StageRecord>,
  ) {}

  /**
   * 创建阶段记录（初始状态为draft）
   */
  async createStageRecord(
    createStageRecordDto: CreateStageRecordDto,
  ): Promise<StageRecord> {
    // 检查该患者该阶段是否已有记录
    const existing = await this.stageRecordRepository.findOne({
      where: {
        patientId: createStageRecordDto.patientId,
        stage: createStageRecordDto.stage,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `患者在${createStageRecordDto.stage}阶段已有记录`,
      );
    }

    const record = this.stageRecordRepository.create({
      ...createStageRecordDto,
      status: 'draft',
    });

    return await this.stageRecordRepository.save(record);
  }

  /**
   * 提交阶段记录（从draft变为submitted）
   */
  async submitStageRecord(
    id: number,
    submitStageRecordDto: SubmitStageRecordDto,
  ): Promise<StageRecord> {
    const record = await this.findOneStageRecord(id);

    if (record.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的记录才能提交');
    }

    record.status = 'submitted';
    record.submittedAt = new Date(submitStageRecordDto.submittedAt);

    return await this.stageRecordRepository.save(record);
  }

  /**
   * 审核阶段记录（医生审核）
   */
  async auditStageRecord(
    id: number,
    auditStageRecordDto: AuditStageRecordDto,
    auditedBy: number,
  ): Promise<StageRecord> {
    const record = await this.findOneStageRecord(id);

    if (record.status !== 'submitted') {
      throw new BadRequestException('只有已提交的记录才能审核');
    }

    if (
      auditStageRecordDto.auditResult === 'rejected' &&
      !auditStageRecordDto.rejectReason
    ) {
      throw new BadRequestException('驳回时必须填写驳回原因');
    }

    record.status = auditStageRecordDto.auditResult;
    record.auditResult = auditStageRecordDto.auditResult;
    record.auditedBy = auditedBy;
    record.auditedAt = new Date();
    record.auditRemark = auditStageRecordDto.auditRemark;
    record.rejectReason = auditStageRecordDto.rejectReason;

    return await this.stageRecordRepository.save(record);
  }

  /**
   * 查询阶段记录列表（支持分页和筛选）
   */
  async findAllStageRecords(query: QueryStageRecordDto) {
    const { patientId, stage, status, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.stageRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('record.auditor', 'auditor')
      .leftJoinAndSelect('auditor.user', 'auditorUser');

    if (patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId });
    }

    if (stage) {
      queryBuilder.andWhere('record.stage = :stage', { stage });
    }

    if (status) {
      queryBuilder.andWhere('record.status = :status', { status });
    }

    queryBuilder
      .orderBy('record.createdAt', 'DESC')
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
   * 根据ID获取阶段记录详情
   */
  async findOneStageRecord(id: number): Promise<StageRecord> {
    const record = await this.stageRecordRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'auditor', 'auditor.user'],
    });

    if (!record) {
      throw new NotFoundException(`阶段记录 ID ${id} 不存在`);
    }

    return record;
  }

  /**
   * 获取患者的阶段记录
   */
  async getPatientStageRecord(
    patientId: number,
    stage: string,
  ): Promise<StageRecord | null> {
    return await this.stageRecordRepository.findOne({
      where: { patientId, stage: stage as any },
      relations: ['auditor', 'auditor.user'],
    });
  }

  /**
   * 删除阶段记录（仅草稿状态可删除）
   */
  async removeStageRecord(id: number): Promise<void> {
    const record = await this.findOneStageRecord(id);

    if (record.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的记录才能删除');
    }

    await this.stageRecordRepository.remove(record);
  }
}
