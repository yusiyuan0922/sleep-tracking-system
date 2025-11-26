import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../../database/entities/operation-log.entity';
import { CreateOperationLogDto, QueryOperationLogDto } from './dto/operation-log.dto';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 创建操作日志
   */
  async create(createOperationLogDto: CreateOperationLogDto): Promise<OperationLog> {
    const operationLog = this.operationLogRepository.create(createOperationLogDto);
    return await this.operationLogRepository.save(operationLog);
  }

  /**
   * 查询操作日志列表（支持分页和筛选）
   */
  async findAll(query: QueryOperationLogDto) {
    const { userId, module, action, success, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.operationLogRepository
      .createQueryBuilder('operationLog')
      .leftJoinAndSelect('operationLog.user', 'user');

    if (userId) {
      queryBuilder.andWhere('operationLog.userId = :userId', { userId });
    }

    if (module) {
      queryBuilder.andWhere('operationLog.module = :module', { module });
    }

    if (action) {
      queryBuilder.andWhere('operationLog.action = :action', { action });
    }

    if (success !== undefined) {
      queryBuilder.andWhere('operationLog.success = :success', { success });
    }

    queryBuilder
      .orderBy('operationLog.createdAt', 'DESC')
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
   * 根据ID获取操作日志详情
   */
  async findOne(id: number): Promise<OperationLog> {
    const operationLog = await this.operationLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!operationLog) {
      throw new NotFoundException(`操作日志 ID ${id} 不存在`);
    }

    return operationLog;
  }

  /**
   * 获取用户的操作日志
   */
  async findByUser(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.operationLogRepository.findAndCount({
      where: { userId },
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

  /**
   * 获取操作统计
   */
  async getStatistics(userId?: number, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.operationLogRepository.createQueryBuilder('operationLog');

    if (userId) {
      queryBuilder.andWhere('operationLog.userId = :userId', { userId });
    }

    if (startDate) {
      queryBuilder.andWhere('operationLog.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('operationLog.createdAt <= :endDate', { endDate });
    }

    const [total, successCount, failureCount] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('operationLog.success = :success', { success: true }).getCount(),
      queryBuilder.clone().andWhere('operationLog.success = :success', { success: false }).getCount(),
    ]);

    // 按模块统计
    const moduleStats = await this.operationLogRepository
      .createQueryBuilder('operationLog')
      .select('operationLog.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .groupBy('operationLog.module')
      .getRawMany();

    // 按操作类型统计
    const actionStats = await this.operationLogRepository
      .createQueryBuilder('operationLog')
      .select('operationLog.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('operationLog.action')
      .getRawMany();

    return {
      total,
      successCount,
      failureCount,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
      moduleStats,
      actionStats,
    };
  }
}
