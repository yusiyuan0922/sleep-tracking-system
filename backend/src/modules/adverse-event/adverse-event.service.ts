import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { AeAttachment } from '../../database/entities/ae-attachment.entity';
import { Patient } from '../../database/entities/patient.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import {
  CreateAdverseEventDto,
  UpdateAdverseEventDto,
  QueryAdverseEventDto,
  CreateAeAttachmentDto,
} from './dto/adverse-event.dto';
import { PushMessageService } from '../push-message/push-message.service';

@Injectable()
export class AdverseEventService {
  constructor(
    @InjectRepository(AdverseEvent)
    private adverseEventRepository: Repository<AdverseEvent>,
    @InjectRepository(AeAttachment)
    private aeAttachmentRepository: Repository<AeAttachment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private pushMessageService: PushMessageService,
  ) {}

  // ==================== 不良事件管理 ====================

  /**
   * 创建不良事件记录
   */
  async createAdverseEvent(
    createAdverseEventDto: CreateAdverseEventDto,
  ): Promise<AdverseEvent> {
    // 生成AE序号: AE-{patientId}-{序号}
    const aeNumber = await this.generateAeNumber(createAdverseEventDto.patientId);

    const event = this.adverseEventRepository.create({
      ...createAdverseEventDto,
      aeNumber,
    });
    const savedEvent = await this.adverseEventRepository.save(event);

    // 查询患者和医生信息
    const patient = await this.patientRepository.findOne({
      where: { id: createAdverseEventDto.patientId },
      relations: ['user'],
    });

    if (patient) {
      const doctor = await this.doctorRepository.findOne({
        where: { id: patient.doctorId },
      });

      if (doctor) {
        // 所有不良事件都通知医生
        await this.pushMessageService.notifyDoctorAdverseEvent(
          doctor.userId,
          patient.user.name,
          createAdverseEventDto.severity,
          savedEvent.id,
          patient.id,
        );
      }
    }

    return savedEvent;
  }

  /**
   * 生成AE序号
   * 格式: AE-{patientId}-{序号}
   */
  private async generateAeNumber(patientId: number): Promise<string> {
    // 查询该患者的不良事件数量
    const count = await this.adverseEventRepository.count({
      where: { patientId },
    });

    // 序号从1开始，补零到3位
    const sequence = String(count + 1).padStart(3, '0');

    return `AE-${patientId}-${sequence}`;
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

    // 格式化返回数据，将字段名映射为前端期望的格式
    const items = events.map(event => ({
      id: event.id,
      aeNumber: event.aeNumber,
      eventName: event.eventName,
      severity: event.severity,
      isSerious: event.isSerious,
      stage: event.stage,
      occurredAt: event.onsetDate,
      onsetDate: event.onsetDate,
      isOngoing: event.isOngoing,
      endDate: event.endDate,
      description: event.description,
      relatedDrug: event.relatedDrug,
      relationship: event.causality, // 映射 causality 为 relationship
      causality: event.causality,
      action: event.action,
      outcome: event.outcome,
      remark: event.remark,
      createdAt: event.createdAt,
      patient: event.patient ? {
        id: event.patient.id,
        name: event.patient.user?.name || '-',
      } : null,
    }));

    return {
      items,
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
