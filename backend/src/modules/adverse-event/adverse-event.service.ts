import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { AeAttachment } from '../../database/entities/ae-attachment.entity';
import {
  CreateAdverseEventDto,
  UpdateAdverseEventDto,
  QueryAdverseEventDto,
  CreateAeAttachmentDto,
} from './dto/adverse-event.dto';

@Injectable()
export class AdverseEventService {
  constructor(
    @InjectRepository(AdverseEvent)
    private adverseEventRepository: Repository<AdverseEvent>,
    @InjectRepository(AeAttachment)
    private aeAttachmentRepository: Repository<AeAttachment>,
  ) {}

  // ==================== 不良事件管理 ====================

  /**
   * 创建不良事件记录
   */
  async createAdverseEvent(
    createAdverseEventDto: CreateAdverseEventDto,
  ): Promise<AdverseEvent> {
    const event = this.adverseEventRepository.create(createAdverseEventDto);
    return await this.adverseEventRepository.save(event);
  }

  /**
   * 查询不良事件列表（支持分页和筛选）
   */
  async findAllAdverseEvents(query: QueryAdverseEventDto) {
    const { patientId, stage, severity, isSerious, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.adverseEventRepository
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user');

    if (patientId) {
      queryBuilder.andWhere('ae.patientId = :patientId', { patientId });
    }

    if (stage) {
      queryBuilder.andWhere('ae.stage = :stage', { stage });
    }

    if (severity) {
      queryBuilder.andWhere('ae.severity = :severity', { severity });
    }

    if (isSerious !== undefined) {
      queryBuilder.andWhere('ae.isSerious = :isSerious', { isSerious });
    }

    queryBuilder
      .orderBy('ae.onsetDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [events, total] = await queryBuilder.getManyAndCount();

    return {
      data: events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取不良事件详情
   */
  async findOneAdverseEvent(id: number): Promise<AdverseEvent> {
    const event = await this.adverseEventRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user'],
    });

    if (!event) {
      throw new NotFoundException(`不良事件 ID ${id} 不存在`);
    }

    return event;
  }

  /**
   * 获取患者某个阶段的不良事件
   */
  async getPatientStageAdverseEvents(
    patientId: number,
    stage: string,
  ): Promise<AdverseEvent[]> {
    return await this.adverseEventRepository.find({
      where: { patientId, stage: stage as any },
      order: { onsetDate: 'DESC' },
    });
  }

  /**
   * 更新不良事件
   */
  async updateAdverseEvent(
    id: number,
    updateAdverseEventDto: UpdateAdverseEventDto,
  ): Promise<AdverseEvent> {
    const event = await this.findOneAdverseEvent(id);

    Object.assign(event, updateAdverseEventDto);

    return await this.adverseEventRepository.save(event);
  }

  /**
   * 删除不良事件
   */
  async removeAdverseEvent(id: number): Promise<void> {
    const event = await this.findOneAdverseEvent(id);
    await this.adverseEventRepository.remove(event);
  }

  // ==================== 不良事件附件管理 ====================

  /**
   * 为不良事件添加附件
   */
  async createAttachment(
    createAeAttachmentDto: CreateAeAttachmentDto,
  ): Promise<AeAttachment> {
    // 验证不良事件是否存在
    await this.findOneAdverseEvent(createAeAttachmentDto.aeId);

    const attachment = this.aeAttachmentRepository.create(createAeAttachmentDto);
    return await this.aeAttachmentRepository.save(attachment);
  }

  /**
   * 获取不良事件的所有附件
   */
  async getEventAttachments(aeId: number): Promise<AeAttachment[]> {
    return await this.aeAttachmentRepository.find({
      where: { aeId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 删除附件
   */
  async removeAttachment(id: number): Promise<void> {
    const attachment = await this.aeAttachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`附件 ID ${id} 不存在`);
    }

    await this.aeAttachmentRepository.remove(attachment);
  }
}
