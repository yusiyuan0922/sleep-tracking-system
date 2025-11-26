import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Hospital } from '../../database/entities/hospital.entity';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  UpdateHospitalStatusDto,
  QueryHospitalDto,
} from './dto/hospital.dto';

@Injectable()
export class HospitalService {
  constructor(
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
  ) {}

  /**
   * 创建医院
   */
  async create(createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    // 检查医院名称是否已存在
    const existing = await this.hospitalRepository.findOne({
      where: { name: createHospitalDto.name },
    });

    if (existing) {
      throw new ConflictException('医院名称已存在');
    }

    const hospital = this.hospitalRepository.create(createHospitalDto);
    return await this.hospitalRepository.save(hospital);
  }

  /**
   * 获取医院列表 (支持分页和筛选)
   */
  async findAll(query: QueryHospitalDto) {
    const { name, province, city, status, page = 1, pageSize = 10 } = query;

    const where: any = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }
    if (province) {
      where.province = province;
    }
    if (city) {
      where.city = city;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.hospitalRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取医院详情
   */
  async findOne(id: number): Promise<Hospital> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id },
    });

    if (!hospital) {
      throw new NotFoundException('医院不存在');
    }

    return hospital;
  }

  /**
   * 更新医院信息
   */
  async update(
    id: number,
    updateHospitalDto: UpdateHospitalDto,
  ): Promise<Hospital> {
    const hospital = await this.findOne(id);

    // 如果要修改名称,检查新名称是否已被其他医院使用
    if (updateHospitalDto.name && updateHospitalDto.name !== hospital.name) {
      const existing = await this.hospitalRepository.findOne({
        where: { name: updateHospitalDto.name },
      });

      if (existing) {
        throw new ConflictException('医院名称已存在');
      }
    }

    Object.assign(hospital, updateHospitalDto);
    return await this.hospitalRepository.save(hospital);
  }

  /**
   * 软删除医院 (修改状态为inactive)
   */
  async remove(id: number): Promise<void> {
    const hospital = await this.findOne(id);
    hospital.status = 'inactive';
    await this.hospitalRepository.save(hospital);
  }

  /**
   * 更新医院状态
   */
  async updateStatus(
    id: number,
    updateStatusDto: UpdateHospitalStatusDto,
  ): Promise<Hospital> {
    const hospital = await this.findOne(id);
    hospital.status = updateStatusDto.status;
    return await this.hospitalRepository.save(hospital);
  }

  /**
   * 获取所有激活状态的医院 (用于下拉选择)
   */
  async findAllActive(): Promise<Hospital[]> {
    return await this.hospitalRepository.find({
      where: { status: 'active' },
      order: { name: 'ASC' },
    });
  }
}
