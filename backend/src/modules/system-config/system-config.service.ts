import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SystemConfig } from '../../database/entities/system-config.entity';
import { CreateSystemConfigDto, UpdateSystemConfigDto, QuerySystemConfigDto } from './dto/system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {}

  /**
   * 创建系统配置
   */
  async create(createSystemConfigDto: CreateSystemConfigDto): Promise<SystemConfig> {
    // 检查配置键是否已存在
    const existing = await this.systemConfigRepository.findOne({
      where: { configKey: createSystemConfigDto.configKey },
    });

    if (existing) {
      throw new ConflictException(`配置键 ${createSystemConfigDto.configKey} 已存在`);
    }

    const config = this.systemConfigRepository.create(createSystemConfigDto);
    return await this.systemConfigRepository.save(config);
  }

  /**
   * 查询系统配置列表
   */
  async findAll(query: QuerySystemConfigDto) {
    const { category, keyword } = query;

    const queryBuilder = this.systemConfigRepository.createQueryBuilder('config');

    if (category) {
      queryBuilder.andWhere('config.category = :category', { category });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(config.configKey LIKE :keyword OR config.configName LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    queryBuilder.orderBy('config.category', 'ASC').addOrderBy('config.configKey', 'ASC');

    const configs = await queryBuilder.getMany();

    return configs;
  }

  /**
   * 根据ID获取系统配置
   */
  async findOne(id: number): Promise<SystemConfig> {
    const config = await this.systemConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`系统配置 ID ${id} 不存在`);
    }

    return config;
  }

  /**
   * 根据配置键获取配置
   */
  async findByKey(configKey: string): Promise<SystemConfig | null> {
    return await this.systemConfigRepository.findOne({
      where: { configKey },
    });
  }

  /**
   * 获取配置值（带类型转换）
   */
  async getValue<T = any>(configKey: string, defaultValue?: T): Promise<T> {
    const config = await this.findByKey(configKey);

    if (!config) {
      return defaultValue as T;
    }

    return this.parseValue(config) as T;
  }

  /**
   * 解析配置值
   */
  private parseValue(config: SystemConfig): any {
    const { configValue, valueType } = config;

    switch (valueType) {
      case 'number':
        return parseFloat(configValue);
      case 'boolean':
        return configValue === 'true';
      case 'json':
        try {
          return JSON.parse(configValue);
        } catch {
          return configValue;
        }
      default:
        return configValue;
    }
  }

  /**
   * 更新系统配置
   */
  async update(id: number, updateSystemConfigDto: UpdateSystemConfigDto): Promise<SystemConfig> {
    const config = await this.findOne(id);

    if (!config.isEditable) {
      throw new BadRequestException('该配置不可编辑');
    }

    Object.assign(config, updateSystemConfigDto);
    return await this.systemConfigRepository.save(config);
  }

  /**
   * 根据配置键更新配置值
   */
  async updateByKey(configKey: string, configValue: string): Promise<SystemConfig> {
    const config = await this.findByKey(configKey);

    if (!config) {
      throw new NotFoundException(`配置键 ${configKey} 不存在`);
    }

    if (!config.isEditable) {
      throw new BadRequestException('该配置不可编辑');
    }

    config.configValue = configValue;
    return await this.systemConfigRepository.save(config);
  }

  /**
   * 删除系统配置
   */
  async remove(id: number): Promise<void> {
    const config = await this.findOne(id);

    if (!config.isEditable) {
      throw new BadRequestException('该配置不可删除');
    }

    await this.systemConfigRepository.remove(config);
  }

  /**
   * 批量设置配置
   */
  async batchSet(configs: Array<{ configKey: string; configValue: string }>): Promise<void> {
    for (const { configKey, configValue } of configs) {
      const config = await this.findByKey(configKey);
      if (config && config.isEditable) {
        config.configValue = configValue;
        await this.systemConfigRepository.save(config);
      }
    }
  }

  /**
   * 获取所有配置分组
   */
  async getCategories(): Promise<string[]> {
    const result = await this.systemConfigRepository
      .createQueryBuilder('config')
      .select('DISTINCT config.category', 'category')
      .where('config.category IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.category);
  }
}
