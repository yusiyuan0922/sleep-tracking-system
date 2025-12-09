import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../database/entities/patient.entity';
import { PushMessageService } from '../push-message/push-message.service';

@Injectable()
export class ScheduleTasksService {
  private readonly logger = new Logger(ScheduleTasksService.name);

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private pushMessageService: PushMessageService,
  ) {}

  /**
   * 每天上午9:00执行阶段窗口到期提醒
   * Cron表达式: 秒 分 时 日 月 周
   * '0 9 * * *' = 每天9:00
   */
  @Cron('0 9 * * *')
  async sendStageExpirationReminders() {
    this.logger.log('开始执行阶段窗口到期提醒任务');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为当天0点,便于计算天数

      // 查询所有活跃患者
      const patients = await this.patientRepository.find({
        where: { status: 'active' },
        relations: ['user'],
      });

      this.logger.log(`找到 ${patients.length} 个活跃患者`);

      let sentCount = 0;

      for (const patient of patients) {
        // 根据当前阶段判断窗口结束时间
        let windowEnd: Date | null = null;
        let stage = '';

        if (patient.currentStage === 'V2' && patient.v2WindowEnd) {
          windowEnd = patient.v2WindowEnd;
          stage = 'V2';
        } else if (patient.currentStage === 'V3' && patient.v3WindowEnd) {
          windowEnd = patient.v3WindowEnd;
          stage = 'V3';
        } else if (patient.currentStage === 'V4' && patient.v4WindowEnd) {
          windowEnd = patient.v4WindowEnd;
          stage = 'V4';
        }

        // 如果没有窗口结束时间或已完成,跳过
        if (!windowEnd || patient.currentStage === 'completed') {
          continue;
        }

        // 计算剩余天数
        const windowEndDate = new Date(windowEnd);
        windowEndDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil(
          (windowEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // 在窗口结束前3天、1天、当天发送提醒
        if (daysLeft === 3 || daysLeft === 1 || daysLeft === 0) {
          try {
            await this.pushMessageService.notifyPatientStageExpiring(
              patient.userId,
              stage,
              daysLeft,
              patient.id,
            );
            sentCount++;
            this.logger.log(
              `已发送提醒: 患者ID=${patient.id}, 阶段=${stage}, 剩余天数=${daysLeft}`,
            );
          } catch (error) {
            this.logger.error(
              `发送提醒失败: 患者ID=${patient.id}, 错误=${error.message}`,
            );
          }
        }
      }

      this.logger.log(`阶段窗口到期提醒任务完成,共发送 ${sentCount} 条消息`);
    } catch (error) {
      this.logger.error(`阶段窗口到期提醒任务执行失败: ${error.message}`);
    }
  }

  /**
   * 测试方法: 每分钟执行一次(用于开发测试)
   * 生产环境请注释掉此方法
   */
  // @Cron(CronExpression.EVERY_MINUTE)
  // async testCronJob() {
  //   this.logger.log('测试定时任务执行中...');
  // }
}
