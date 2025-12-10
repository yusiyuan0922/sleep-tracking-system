import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../database/entities/patient.entity';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(AdverseEvent)
    private adverseEventRepository: Repository<AdverseEvent>,
    @InjectRepository(ScaleRecord)
    private scaleRecordRepository: Repository<ScaleRecord>,
    @InjectRepository(ScaleConfig)
    private scaleConfigRepository: Repository<ScaleConfig>,
  ) {}

  /**
   * 获取仪表盘统计数据
   */
  async getStatistics() {
    // 患者总数
    const totalPatients = await this.patientRepository.count();

    // 本周新增患者数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyNewPatients = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.createdAt >= :oneWeekAgo', { oneWeekAgo })
      .getCount();

    // 待审核患者数
    const pendingAudits = await this.patientRepository.count({
      where: { pendingReview: true },
    });

    // 逾期未完成患者数（超过时间窗口但未完成当前阶段的患者）
    const now = new Date();
    const overduePatients = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.currentStage IN (:...stages)', {
        stages: ['V1', 'V2', 'V3', 'V4'],
      })
      .andWhere(
        '((patient.currentStage = :v2 AND patient.v2WindowEnd < :now) OR ' +
          '(patient.currentStage = :v3 AND patient.v3WindowEnd < :now) OR ' +
          '(patient.currentStage = :v4 AND patient.v4WindowEnd < :now))',
        { v2: 'V2', v3: 'V3', v4: 'V4', now },
      )
      .getCount();

    // 严重不良事件数
    const seriousAE = await this.adverseEventRepository.count({
      where: { isSerious: true },
    });

    return {
      totalPatients,
      weeklyNewPatients,
      pendingAudits,
      overduePatients,
      seriousAE,
    };
  }

  /**
   * 获取患者阶段分布数据
   */
  async getStageDistribution() {
    const stages = ['V1', 'V2', 'V3', 'V4', 'completed'] as const;
    const distribution = [];

    for (const stage of stages) {
      const count = await this.patientRepository.count({
        where: { currentStage: stage },
      });
      const stageName = stage === 'completed' ? '已完成' : `${stage}阶段`;
      distribution.push({ value: count, name: stageName });
    }

    return distribution;
  }

  /**
   * 获取周月数据对比
   * 统计本周vs上周、本月vs上月的关键指标
   */
  async getWeeklyMonthlyComparison() {
    const now = new Date();

    // 本周开始（周一）
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay() + 1);
    thisWeekStart.setHours(0, 0, 0, 0);

    // 上周开始
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    // 本月开始
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 上月开始和结束
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 统计新增患者
    const thisWeekPatients = await this.patientRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :start', { start: thisWeekStart })
      .getCount();

    const lastWeekPatients = await this.patientRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :start AND p.createdAt < :end', {
        start: lastWeekStart,
        end: lastWeekEnd,
      })
      .getCount();

    const thisMonthPatients = await this.patientRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :start', { start: thisMonthStart })
      .getCount();

    const lastMonthPatients = await this.patientRepository
      .createQueryBuilder('p')
      .where('p.createdAt >= :start AND p.createdAt <= :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .getCount();

    // 统计量表填写
    const thisWeekScales = await this.scaleRecordRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :start', { start: thisWeekStart })
      .getCount();

    const lastWeekScales = await this.scaleRecordRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :start AND s.createdAt < :end', {
        start: lastWeekStart,
        end: lastWeekEnd,
      })
      .getCount();

    const thisMonthScales = await this.scaleRecordRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :start', { start: thisMonthStart })
      .getCount();

    const lastMonthScales = await this.scaleRecordRepository
      .createQueryBuilder('s')
      .where('s.createdAt >= :start AND s.createdAt <= :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .getCount();

    // 统计不良事件
    const thisWeekAE = await this.adverseEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start', { start: thisWeekStart })
      .getCount();

    const lastWeekAE = await this.adverseEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start AND ae.createdAt < :end', {
        start: lastWeekStart,
        end: lastWeekEnd,
      })
      .getCount();

    const thisMonthAE = await this.adverseEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start', { start: thisMonthStart })
      .getCount();

    const lastMonthAE = await this.adverseEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start AND ae.createdAt <= :end', {
        start: lastMonthStart,
        end: lastMonthEnd,
      })
      .getCount();

    return {
      categories: ['新增患者', '量表填写', '不良事件'],
      series: [
        { name: '本周', data: [thisWeekPatients, thisWeekScales, thisWeekAE] },
        { name: '上周', data: [lastWeekPatients, lastWeekScales, lastWeekAE] },
        {
          name: '本月',
          data: [thisMonthPatients, thisMonthScales, thisMonthAE],
        },
        {
          name: '上月',
          data: [lastMonthPatients, lastMonthScales, lastMonthAE],
        },
      ],
    };
  }

  /**
   * 获取不良事件统计数据
   * 按阶段和严重程度统计
   */
  async getAdverseEventStats() {
    const stages = ['V1', 'V2', 'V3', 'V4'];
    const severities = ['mild', 'moderate', 'severe'] as const;
    const severityNames: Record<string, string> = {
      mild: '轻度',
      moderate: '中度',
      severe: '重度',
    };

    const result: Record<string, number[]> = {};

    for (const severity of severities) {
      const counts: number[] = [];
      for (const stage of stages) {
        const count = await this.adverseEventRepository.count({
          where: { stage: stage as any, severity },
        });
        counts.push(count);
      }
      result[severityNames[severity]] = counts;
    }

    return {
      stages,
      series: Object.entries(result).map(([name, data]) => ({
        name,
        data,
      })),
    };
  }

  /**
   * 获取最近7天活跃趋势
   * 活跃定义：当天有量表填写、用药记录、不良事件上报的患者
   */
  async getDailyActivityTrend() {
    const result: { dates: string[]; patients: number[]; scales: number[] } = {
      dates: [],
      patients: [],
      scales: [],
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      // 格式化日期显示
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      result.dates.push(dateStr);

      // 当天活跃患者数（有量表记录的不重复患者）
      const activePatients = await this.scaleRecordRepository
        .createQueryBuilder('sr')
        .select('COUNT(DISTINCT sr.patientId)', 'count')
        .where('sr.createdAt >= :start AND sr.createdAt <= :end', {
          start: dayStart,
          end: dayEnd,
        })
        .getRawOne();
      result.patients.push(parseInt(activePatients?.count || '0', 10));

      // 当天量表填写数
      const scaleCount = await this.scaleRecordRepository
        .createQueryBuilder('sr')
        .where('sr.createdAt >= :start AND sr.createdAt <= :end', {
          start: dayStart,
          end: dayEnd,
        })
        .getCount();
      result.scales.push(scaleCount);
    }

    return result;
  }

  /**
   * 获取最近动态
   * 包括患者注册、阶段完成、量表填写、不良事件等
   */
  async getRecentActivities(limit = 10) {
    const activities: Array<{ content: string; timestamp: string }> = [];

    // 获取最近注册的患者
    const recentPatients = await this.patientRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const patient of recentPatients) {
      activities.push({
        content: `患者${patient.user?.name || '未知'}完成了注册`,
        timestamp: this.formatDate(patient.createdAt),
      });
    }

    // 获取最近完成阶段的患者
    const recentV1Completed = await this.patientRepository.find({
      relations: ['user'],
      where: { v1CompletedAt: undefined },
      order: { v1CompletedAt: 'DESC' },
      take: 3,
    });

    // 获取有v1CompletedAt的患者
    const v1CompletedPatients = await this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .where('patient.v1CompletedAt IS NOT NULL')
      .orderBy('patient.v1CompletedAt', 'DESC')
      .take(3)
      .getMany();

    for (const patient of v1CompletedPatients) {
      activities.push({
        content: `患者${patient.user?.name || '未知'}完成了V1阶段审核`,
        timestamp: this.formatDate(patient.v1CompletedAt),
      });
    }

    // 获取最近的不良事件
    const recentAEs = await this.adverseEventRepository.find({
      relations: ['patient', 'patient.user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const ae of recentAEs) {
      const severityText =
        ae.severity === 'mild'
          ? '轻度'
          : ae.severity === 'moderate'
            ? '中度'
            : '重度';
      activities.push({
        content: `检测到1例${severityText}不良事件`,
        timestamp: this.formatDate(ae.createdAt),
      });
    }

    // 获取最近的量表记录
    const recentScales = await this.scaleRecordRepository.find({
      relations: ['patient', 'patient.user', 'scale'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const scale of recentScales) {
      activities.push({
        content: `患者${scale.patient?.user?.name || '未知'}填写了${scale.scale?.name || ''}量表`,
        timestamp: this.formatDate(scale.createdAt),
      });
    }

    // 按时间排序并限制数量
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return activities.slice(0, limit);
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
