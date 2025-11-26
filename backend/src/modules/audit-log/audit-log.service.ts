import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 创建审计日志
   */
  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * 查询审计日志列表（支持分页和筛选）
   */
  async findAll(query: QueryAuditLogDto) {
    const { stageRecordId, auditorId, action, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.stageRecord', 'stageRecord')
      .leftJoinAndSelect('stageRecord.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('auditLog.auditor', 'auditor')
      .leftJoinAndSelect('auditor.user', 'auditorUser');

    if (stageRecordId) {
      queryBuilder.andWhere('auditLog.stageRecordId = :stageRecordId', { stageRecordId });
    }

    if (auditorId) {
      queryBuilder.andWhere('auditLog.auditorId = :auditorId', { auditorId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    queryBuilder
      .orderBy('auditLog.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取审计日志详情
   */
  async findOne(id: number): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
      relations: [
        'stageRecord',
        'stageRecord.patient',
        'stageRecord.patient.user',
        'auditor',
        'auditor.user',
      ],
    });

    if (!auditLog) {
      throw new NotFoundException(`审计日志 ID ${id} 不存在`);
    }

    return auditLog;
  }

  /**
   * 获取阶段记录的所有审计日志
   */
  async findByStageRecord(stageRecordId: number): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { stageRecordId },
      relations: ['auditor', 'auditor.user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取医生的审计日志
   */
  async findByAuditor(auditorId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.auditLogRepository.findAndCount({
      where: { auditorId },
      relations: [
        'stageRecord',
        'stageRecord.patient',
        'stageRecord.patient.user',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
