import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { Patient } from '../../database/entities/patient.entity';
import {
  CreateScaleConfigDto,
  UpdateScaleConfigDto,
  SubmitScaleRecordDto,
  QueryScaleRecordDto,
} from './dto/scale.dto';

@Injectable()
export class ScaleService {
  constructor(
    @InjectRepository(ScaleConfig)
    private readonly scaleConfigRepository: Repository<ScaleConfig>,
    @InjectRepository(ScaleRecord)
    private readonly scaleRecordRepository: Repository<ScaleRecord>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * 创建量表配置
   */
  async createConfig(
    createScaleConfigDto: CreateScaleConfigDto,
  ): Promise<ScaleConfig> {
    // 检查量表代码是否已存在
    const existing = await this.scaleConfigRepository.findOne({
      where: { code: createScaleConfigDto.code as any },
    });
    if (existing) {
      throw new ConflictException(
        `量表代码 ${createScaleConfigDto.code} 已存在`,
      );
    }

    const scaleConfig = this.scaleConfigRepository.create(createScaleConfigDto);
    return this.scaleConfigRepository.save(scaleConfig);
  }

  /**
   * 获取所有量表配置列表
   */
  async findAllConfigs(status?: string): Promise<ScaleConfig[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    return await this.scaleConfigRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID获取量表配置
   */
  async findConfigById(id: number): Promise<ScaleConfig> {
    const config = await this.scaleConfigRepository.findOne({
      where: { id },
    });
    if (!config) {
      throw new NotFoundException(`量表配置ID ${id} 不存在`);
    }
    return config;
  }

  /**
   * 根据代码获取量表配置
   */
  async findConfigByCode(code: string): Promise<ScaleConfig> {
    const config = await this.scaleConfigRepository.findOne({
      where: { code: code as any },
    });
    if (!config) {
      throw new NotFoundException(`量表代码 ${code} 不存在`);
    }
    return config;
  }

  /**
   * 更新量表配置
   */
  async updateConfig(
    id: number,
    updateScaleConfigDto: UpdateScaleConfigDto,
  ): Promise<ScaleConfig> {
    const config = await this.findConfigById(id);

    if (updateScaleConfigDto.name !== undefined) {
      config.name = updateScaleConfigDto.name;
    }
    if (updateScaleConfigDto.totalItems !== undefined) {
      config.totalItems = updateScaleConfigDto.totalItems;
    }
    if (updateScaleConfigDto.maxScore !== undefined) {
      config.maxScore = updateScaleConfigDto.maxScore;
    }
    if (updateScaleConfigDto.questions !== undefined) {
      config.questions = updateScaleConfigDto.questions;
    }
    if (updateScaleConfigDto.scoringRules !== undefined) {
      config.scoringRules = updateScaleConfigDto.scoringRules;
    }
    if (updateScaleConfigDto.status !== undefined) {
      config.status = updateScaleConfigDto.status as any;
    }

    return await this.scaleConfigRepository.save(config);
  }

  /**
   * 删除量表配置
   */
  async removeConfig(id: number): Promise<void> {
    const config = await this.findConfigById(id);
    await this.scaleConfigRepository.remove(config);
  }

  /**
   * 提交量表记录(患者填写)
   */
  async submitRecord(
    submitScaleRecordDto: SubmitScaleRecordDto,
  ): Promise<ScaleRecord> {
    const { patientId, scaleId, stage, answers } = submitScaleRecordDto;

    // 检查患者是否存在
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`患者ID ${patientId} 不存在`);
    }

    // 检查量表配置是否存在且激活
    const scaleConfig = await this.findConfigById(scaleId);
    if (scaleConfig.status !== 'active') {
      throw new BadRequestException('该量表已停用,无法提交');
    }

    // 验证答案数量
    if (answers.length !== scaleConfig.totalItems) {
      throw new BadRequestException(
        `答案数量不匹配,应为 ${scaleConfig.totalItems} 题`,
      );
    }

    // 计算总分
    const totalScore = answers.reduce((sum, score) => sum + score, 0);

    // 根据评分规则计算等级和描述
    let level: string | null = null;
    let description: string | null = null;

    if (scaleConfig.scoringRules && scaleConfig.scoringRules.ranges) {
      const range = scaleConfig.scoringRules.ranges.find(
        (r: any) => totalScore >= r.min && totalScore <= r.max,
      );
      if (range) {
        level = range.level;
        description = range.description;
      }
    }

    // 创建量表记录
    const record = this.scaleRecordRepository.create({
      patientId,
      scaleId,
      stage: stage as any,
      answers,
      totalScore,
      level,
      description,
    });

    return await this.scaleRecordRepository.save(record);
  }

  /**
   * 查询量表记录列表
   */
  async findAllRecords(query: QueryScaleRecordDto) {
    const { patientId, scaleId, stage, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.scaleRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('record.scale', 'scale');

    // 按患者筛选
    if (patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId });
    }

    // 按量表筛选
    if (scaleId) {
      queryBuilder.andWhere('record.scaleId = :scaleId', { scaleId });
    }

    // 按阶段筛选
    if (stage) {
      queryBuilder.andWhere('record.stage = :stage', { stage });
    }

    // 排序和分页
    queryBuilder
      .orderBy('record.completedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID获取量表记录详情
   */
  async findRecordById(id: number): Promise<ScaleRecord> {
    const record = await this.scaleRecordRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'scale'],
    });

    if (!record) {
      throw new NotFoundException(`量表记录ID ${id} 不存在`);
    }

    return record;
  }

  /**
   * 获取患者某个阶段的所有量表记录
   */
  async getPatientStageRecords(
    patientId: number,
    stage: string,
  ): Promise<ScaleRecord[]> {
    return await this.scaleRecordRepository.find({
      where: { patientId, stage: stage as any },
      relations: ['scale'],
      order: { completedAt: 'DESC' },
    });
  }
}
