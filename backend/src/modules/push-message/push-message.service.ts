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
  async findByUser(userId: number, page = 1, pageSize = 10, type?: string, isRead?: boolean) {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [items, total] = await this.pushMessageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: items,
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

  /**
   * 异步发送推送消息(不阻塞主流程)
   * 预留微信订阅消息接口
   */
  async sendPushAsync(userId: number, messageDto: CreatePushMessageDto): Promise<void> {
    // 异步执行,不等待结果
    this.create(messageDto).catch(err => {
      console.error('[PushMessageService] 推送消息失败:', err);
    });

    // 预留:微信订阅消息(未来实现)
    // if (process.env.WECHAT_SUBSCRIBE_ENABLED === 'true') {
    //   const user = await this.userRepository.findOne({ where: { id: userId } });
    //   await this.sendWechatSubscribeMessage(user.openid, templateId, data);
    // }
  }

  /**
   * 患者注册成功消息
   */
  async notifyPatientRegistered(userId: number, patientName: string): Promise<void> {
    await this.sendPushAsync(userId, {
      userId,
      type: 'system_notice',
      title: '注册成功',
      content: `${patientName},欢迎使用睡眠追踪系统!请按医生指导完成各阶段任务。`,
      data: {
        navigateTo: '/pages/index/index',
      },
    });
  }

  /**
   * 医生分配通知(通知患者)
   */
  async notifyPatientAssignedToDoctor(
    userId: number,
    doctorName: string,
    hospitalName: string,
  ): Promise<void> {
    await this.sendPushAsync(userId, {
      userId,
      type: 'system_notice',
      title: '医生分配通知',
      content: `您已被分配给${hospitalName}的${doctorName}医生,医生将跟进您的治疗进度。`,
      data: {
        navigateTo: '/pages/profile/index',
      },
    });
  }

  /**
   * 新患者分配通知(通知医生)
   */
  async notifyDoctorNewPatient(
    userId: number,
    patientName: string,
    patientId: number,
  ): Promise<void> {
    await this.sendPushAsync(userId, {
      userId,
      type: 'system_notice',
      title: '新患者分配',
      content: `患者${patientName}已加入您的管理列表,请及时关注患者进度。`,
      data: {
        patientId,
        navigateTo: `/pages/doctor/patient-detail?id=${patientId}`,
      },
    });
  }

  /**
   * 患者提交审核通知(通知医生)
   */
  async notifyDoctorPatientSubmittedReview(
    userId: number,
    patientName: string,
    stage: string,
    patientId: number,
  ): Promise<void> {
    await this.sendPushAsync(userId, {
      userId,
      type: 'system_notice',
      title: '患者提交审核',
      content: `患者${patientName}已提交${stage}阶段审核,请及时处理。`,
      data: {
        stage,
        patientId,
        navigateTo: `/pages/doctor/review?patientId=${patientId}&stage=${stage}`,
      },
    });
  }

  /**
   * 阶段审核通过(详细版,含下一阶段必填项)
   */
  async notifyPatientStageApproved(
    userId: number,
    currentStage: string,
    nextStage: string,
    requirements: string[],
  ): Promise<void> {
    const requirementsText = requirements.length > 0
      ? `\n请完成以下必填项:\n${requirements.join('、')}`
      : '';

    await this.sendPushAsync(userId, {
      userId,
      type: 'audit_result',
      title: '审核通过',
      content: `您的${currentStage}阶段记录已审核通过,当前进入${nextStage}阶段。${requirementsText}`,
      data: {
        currentStage,
        nextStage,
        requirements,
        result: 'approved',
        navigateTo: '/pages/index/index',
      },
    });
  }

  /**
   * 窗口到期提醒
   */
  async notifyPatientStageExpiring(
    userId: number,
    stage: string,
    daysLeft: number,
    patientId: number,
  ): Promise<void> {
    let content: string;
    if (daysLeft === 0) {
      content = `您的${stage}阶段今天到期,请务必及时完成填写!`;
    } else if (daysLeft === 1) {
      content = `您的${stage}阶段将在1天后到期,请尽快完成填写。`;
    } else {
      content = `您的${stage}阶段将在${daysLeft}天后到期,请及时完成填写。`;
    }

    await this.sendPushAsync(userId, {
      userId,
      type: 'stage_reminder',
      title: '阶段到期提醒',
      content,
      data: {
        stage,
        daysLeft,
        patientId,
        navigateTo: '/pages/index/index',
      },
    });
  }

  /**
   * 不良事件通知医生
   */
  async notifyDoctorAdverseEvent(
    userId: number,
    patientName: string,
    severity: string,
    aeId: number,
    patientId: number,
  ): Promise<void> {
    const severityText = {
      mild: '轻度',
      moderate: '中度',
      severe: '严重',
    }[severity] || severity;

    await this.sendPushAsync(userId, {
      userId,
      type: 'ae_alert',
      title: '不良事件预警',
      content: `患者${patientName}报告了严重程度为${severityText}的不良事件,请及时处理。`,
      data: {
        patientName,
        severity,
        aeId,
        patientId,
        navigateTo: `/pages/adverse-event/detail?id=${aeId}`,
      },
    });
  }

  /**
   * 医生注册审核结果
   */
  async notifyDoctorAuditResult(
    userId: number,
    result: 'approved' | 'rejected',
    remark?: string,
  ): Promise<void> {
    const title = result === 'approved' ? '注册审核通过' : '注册审核未通过';
    const content = result === 'approved'
      ? '恭喜您!您的医生资质审核已通过,现在可以开始管理患者。'
      : `很抱歉,您的医生资质审核未通过。${remark ? `原因:${remark}` : ''}`;

    await this.sendPushAsync(userId, {
      userId,
      type: 'audit_result',
      title,
      content,
      data: {
        result,
        remark,
        navigateTo: '/pages/profile/index',
      },
    });
  }

  // 预留:微信订阅消息接口(未来实现)
  // private async sendWechatSubscribeMessage(
  //   openid: string,
  //   templateId: string,
  //   data: any
  // ): Promise<void> {
  //   // 调用微信API发送订阅消息
  //   // https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/subscribe-message/subscribeMessage.send.html
  // }
}
