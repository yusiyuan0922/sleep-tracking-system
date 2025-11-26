import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PushMessage } from '../../database/entities/push-message.entity';
import { CreatePushMessageDto, QueryPushMessageDto } from './dto/push-message.dto';

@Injectable()
export class PushMessageService {
  constructor(
    @InjectRepository(PushMessage)
    private pushMessageRepository: Repository<PushMessage>,
  ) {}

  /**
   * 创建推送消息
   */
  async create(createPushMessageDto: CreatePushMessageDto): Promise<PushMessage> {
    const message = this.pushMessageRepository.create(createPushMessageDto);
    return await this.pushMessageRepository.save(message);
  }

  /**
   * 批量创建推送消息
   */
  async createBatch(createPushMessageDtos: CreatePushMessageDto[]): Promise<PushMessage[]> {
    const messages = this.pushMessageRepository.create(createPushMessageDtos);
    return await this.pushMessageRepository.save(messages);
  }

  /**
   * 查询推送消息列表（支持分页和筛选）
   */
  async findAll(query: QueryPushMessageDto) {
    const { userId, type, isRead, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.pushMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user');

    if (userId) {
      queryBuilder.andWhere('message.userId = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('message.type = :type', { type });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('message.isRead = :isRead', { isRead });
    }

    queryBuilder
      .orderBy('message.createdAt', 'DESC')
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
   * 根据ID获取推送消息详情
   */
  async findOne(id: number): Promise<PushMessage> {
    const message = await this.pushMessageRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!message) {
      throw new NotFoundException(`推送消息 ID ${id} 不存在`);
    }

    return message;
  }

  /**
   * 获取用户的推送消息
   */
  async findByUser(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.pushMessageRepository.findAndCount({
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
   * 获取用户未读消息数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.pushMessageRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(messageIds: number[]): Promise<void> {
    await this.pushMessageRepository.update(
      { id: In(messageIds) },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * 标记用户所有消息为已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.pushMessageRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * 删除推送消息
   */
  async remove(id: number): Promise<void> {
    const message = await this.findOne(id);
    await this.pushMessageRepository.remove(message);
  }

  /**
   * 批量删除推送消息
   */
  async removeBatch(messageIds: number[]): Promise<void> {
    await this.pushMessageRepository.delete({ id: In(messageIds) });
  }

  /**
   * 创建阶段提醒消息
   */
  async createStageReminder(userId: number, stage: string, patientName: string): Promise<PushMessage> {
    return this.create({
      userId,
      type: 'stage_reminder',
      title: `${stage}阶段提醒`,
      content: `患者${patientName}的${stage}阶段即将到期，请及时跟进`,
      data: { stage, patientName },
    });
  }

  /**
   * 创建审核结果消息
   */
  async createAuditResultMessage(
    userId: number,
    stage: string,
    result: 'approved' | 'rejected',
    remark?: string,
  ): Promise<PushMessage> {
    const title = result === 'approved' ? '审核通过' : '审核被驳回';
    const content = result === 'approved'
      ? `您的${stage}阶段记录已审核通过`
      : `您的${stage}阶段记录被驳回，原因：${remark || '未填写'}`;

    return this.create({
      userId,
      type: 'audit_result',
      title,
      content,
      data: { stage, result, remark },
    });
  }

  /**
   * 创建不良事件预警消息
   */
  async createAEAlert(userId: number, patientName: string, severity: string): Promise<PushMessage> {
    return this.create({
      userId,
      type: 'ae_alert',
      title: '不良事件预警',
      content: `患者${patientName}报告了严重程度为${severity}的不良事件，请及时处理`,
      data: { patientName, severity },
    });
  }

  /**
   * 创建系统通知
   */
  async createSystemNotice(userId: number, title: string, content: string, data?: Record<string, any>): Promise<PushMessage> {
    return this.create({
      userId,
      type: 'system_notice',
      title,
      content,
      data,
    });
  }
}
