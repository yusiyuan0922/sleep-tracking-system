import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from '../../database/entities/doctor.entity';
import { User } from '../../database/entities/user.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import {
  RegisterDoctorDto,
  UpdateDoctorDto,
  AuditDoctorDto,
  QueryDoctorDto,
} from './dto/doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  /**
   * 医生注册
   */
  async register(registerDoctorDto: RegisterDoctorDto): Promise<Doctor> {
    const { userId, hospitalId, ...rest } = registerDoctorDto;

    // 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户角色是否为doctor
    if (user.role !== 'doctor') {
      throw new BadRequestException('该用户不是医生角色');
    }

    // 检查该用户是否已经注册为医生
    const existingDoctor = await this.doctorRepository.findOne({
      where: { userId },
    });
    if (existingDoctor) {
      throw new ConflictException('该用户已注册为医生');
    }

    // 检查医院是否存在且状态为active
    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException('医院不存在');
    }
    if (hospital.status !== 'active') {
      throw new BadRequestException('该医院已停用,无法注册');
    }

    // 创建医生记录,默认审核状态为pending
    const doctor = this.doctorRepository.create({
      userId,
      hospitalId,
      ...rest,
      auditStatus: 'pending',
    });

    return await this.doctorRepository.save(doctor);
  }

  /**
   * 查询医生列表(分页+筛选)
   */
  async findAll(query: QueryDoctorDto) {
    const {
      hospitalId,
      auditStatus,
      name,
      page = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .leftJoinAndSelect('doctor.auditor', 'auditor');

    // 按医院筛选
    if (hospitalId) {
      queryBuilder.andWhere('doctor.hospitalId = :hospitalId', { hospitalId });
    }

    // 按审核状态筛选
    if (auditStatus) {
      queryBuilder.andWhere('doctor.auditStatus = :auditStatus', {
        auditStatus,
      });
    }

    // 按医生姓名模糊搜索
    if (name) {
      queryBuilder.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }

    // 排序和分页
    queryBuilder
      .orderBy('doctor.createdAt', 'DESC')
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
   * 获取医生详情
   */
  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user', 'hospital', 'auditor'],
    });

    if (!doctor) {
      throw new NotFoundException(`医生ID ${id} 不存在`);
    }

    return doctor;
  }

  /**
   * 根据用户ID获取医生信息
   */
  async findByUserId(userId: number): Promise<Doctor | null> {
    return await this.doctorRepository.findOne({
      where: { userId },
      relations: ['user', 'hospital'],
    });
  }

  /**
   * 管理员审核医生
   */
  async audit(
    id: number,
    auditDoctorDto: AuditDoctorDto,
    adminUserId: number,
  ): Promise<Doctor> {
    const doctor = await this.findOne(id);

    // 只有pending状态的医生才能审核
    if (doctor.auditStatus !== 'pending') {
      throw new BadRequestException(
        `医生审核状态为 ${doctor.auditStatus},无法再次审核`,
      );
    }

    // 更新审核状态
    doctor.auditStatus = auditDoctorDto.auditStatus;
    doctor.auditRemark = auditDoctorDto.auditRemark;
    doctor.auditedBy = adminUserId;
    doctor.auditedAt = new Date();

    return await this.doctorRepository.save(doctor);
  }

  /**
   * 更新医生信息
   */
  async update(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor> {
    const doctor = await this.findOne(id);

    // 如果更新医院ID,需要验证医院是否存在且激活
    if (updateDoctorDto.hospitalId) {
      const hospital = await this.hospitalRepository.findOne({
        where: { id: updateDoctorDto.hospitalId },
      });
      if (!hospital) {
        throw new NotFoundException('医院不存在');
      }
      if (hospital.status !== 'active') {
        throw new BadRequestException('该医院已停用');
      }
    }

    // 更新医生信息
    Object.assign(doctor, updateDoctorDto);

    return await this.doctorRepository.save(doctor);
  }

  /**
   * 删除医生(软删除,实际上不删除记录,可以通过修改审核状态为rejected实现)
   */
  async remove(id: number): Promise<void> {
    const doctor = await this.findOne(id);

    // 将审核状态改为rejected,备注说明为管理员删除
    doctor.auditStatus = 'rejected';
    doctor.auditRemark = '管理员删除';

    await this.doctorRepository.save(doctor);
  }
}
