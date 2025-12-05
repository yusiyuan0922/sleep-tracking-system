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
import { Patient } from '../../database/entities/patient.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import {
  CreateDoctorDto,
  RegisterDoctorDto,
  UpdateDoctorDto,
  AuditDoctorDto,
  QueryDoctorDto,
} from './dto/doctor.dto';
import { STAGE_REQUIREMENTS } from '../../../../shared/constants/stages';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(ScaleRecord)
    private readonly scaleRecordRepository: Repository<ScaleRecord>,
    @InjectRepository(ScaleConfig)
    private readonly scaleConfigRepository: Repository<ScaleConfig>,
    @InjectRepository(MedicalFile)
    private readonly medicalFileRepository: Repository<MedicalFile>,
    @InjectRepository(MedicationRecord)
    private readonly medicationRecordRepository: Repository<MedicationRecord>,
    @InjectRepository(ConcomitantMedication)
    private readonly concomitantMedicationRepository: Repository<ConcomitantMedication>,
  ) {}

  /**
   * 管理员创建医生账号(会同时创建User和Doctor记录)
   */
  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { name, phone, hospitalId, ...rest } = createDoctorDto;

    // 检查手机号是否已被使用
    const existingUser = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingUser) {
      throw new ConflictException('该手机号已被使用');
    }

    // 检查医院是否存在且状态为active
    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException('医院不存在');
    }
    if (hospital.status !== 'active') {
      throw new BadRequestException('该医院已停用,无法创建医生');
    }

    // 创建User记录
    // 为管理员创建的医生生成一个特殊的openid(基于手机号)
    const openid = `admin_created_${phone}`;

    const user = this.userRepository.create({
      openid,
      phone,
      name,
      role: 'doctor',
      status: 'active',
    });
    const savedUser = await this.userRepository.save(user);

    // 创建Doctor记录,默认审核状态为approved(管理员创建默认通过)
    const doctor = this.doctorRepository.create({
      userId: savedUser.id,
      hospitalId,
      ...rest,
      auditStatus: 'approved',
    });

    return await this.doctorRepository.save(doctor);
  }

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

    // 提取User相关字段和Doctor相关字段
    const { name, phone, ...doctorFields } = updateDoctorDto;

    // 如果有User相关字段需要更新
    if (name !== undefined || phone !== undefined) {
      const user = await this.userRepository.findOne({
        where: { id: doctor.userId },
      });
      if (!user) {
        throw new NotFoundException('关联的用户不存在');
      }

      // 如果更新手机号,检查手机号是否被其他用户使用
      if (phone && phone !== user.phone) {
        const existingUser = await this.userRepository.findOne({
          where: { phone },
        });
        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictException('该手机号已被使用');
        }
        user.phone = phone;
      }

      // 更新姓名
      if (name !== undefined) {
        user.name = name;
      }

      await this.userRepository.save(user);
    }

    // 更新医生信息
    Object.assign(doctor, doctorFields);

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

  /**
   * 获取医生的患者列表
   */
  async getMyPatients(userId: number, query?: any) {
    // 先找到医生记录
    const doctor = await this.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundException('医生信息不存在');
    }

    // 构建查询条件
    const where: any = { doctorId: doctor.id };

    // 如果有阶段筛选
    if (query?.currentStage) {
      where.currentStage = query.currentStage;
    }

    // 查询该医生的所有患者
    let patients = await this.patientRepository.find({
      where,
      relations: ['user', 'doctor', 'doctor.user', 'hospital'],
      order: { createdAt: 'DESC' },
    });

    // 如果有搜索关键词,过滤患者
    if (query?.name) {
      const keyword = query.name.toLowerCase();
      patients = patients.filter(
        patient =>
          patient.user?.name?.toLowerCase().includes(keyword) ||
          patient.patientNo?.toLowerCase().includes(keyword),
      );
    }

    // 格式化返回数据，并行检查每个患者的待审核状态
    const formattedPatients = await Promise.all(
      patients.map(async patient => {
        let pendingReview = false;

        // 只有未完成的患者才需要检查待审核状态
        if (patient.currentStage !== 'completed') {
          const checkResult = await this.checkStageRequirements(
            patient.id,
            patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4',
          );
          pendingReview = checkResult.canComplete;
        }

        return {
          id: patient.id,
          name: patient.user?.name,
          patientCode: patient.patientNo,
          gender: patient.user?.gender,
          currentStage: patient.currentStage,
          enrollmentDate: patient.enrollmentDate,
          hospital: patient.hospital?.name,
          pendingReview,
        };
      }),
    );

    return formattedPatients;
  }

  /**
   * 检查阶段是否满足完成条件
   */
  private async checkStageRequirements(
    patientId: number,
    stage: 'V1' | 'V2' | 'V3' | 'V4',
  ) {
    const requirements = STAGE_REQUIREMENTS[stage];
    const missingRequirements: Array<{
      type: string;
      code?: string;
      name?: string;
      message?: string;
    }> = [];
    const completedRequirements: Array<{
      type: string;
      code?: string;
      name?: string;
    }> = [];

    // 检查量表
    for (const scaleCode of requirements.requiredScales) {
      // 先查找量表配置获取scaleId
      const scaleConfig = await this.scaleConfigRepository.findOne({
        where: { code: scaleCode as any },
      });

      if (!scaleConfig) {
        missingRequirements.push({
          type: 'scale',
          code: scaleCode,
          name: `${scaleCode}量表`,
          message: '量表配置不存在',
        });
        continue;
      }

      // 使用scaleId查询量表记录
      const scaleRecord = await this.scaleRecordRepository.findOne({
        where: { patientId, stage, scaleId: scaleConfig.id },
      });

      if (scaleRecord) {
        completedRequirements.push({
          type: 'scale',
          code: scaleCode,
          name: `${scaleCode}量表`,
        });
      } else {
        missingRequirements.push({
          type: 'scale',
          code: scaleCode,
          name: `${scaleCode}量表`,
        });
      }
    }

    // 检查病历文件
    if (requirements.requiresMedicalFiles) {
      const medicalFile = await this.medicalFileRepository.findOne({
        where: { patientId, stage },
      });

      if (medicalFile) {
        completedRequirements.push({ type: 'medicalFile', name: '病历文件' });
      } else {
        missingRequirements.push({
          type: 'medicalFile',
          message: '需要上传病历文件',
        });
      }
    }

    // 检查用药记录
    if (requirements.requiresMedicationRecord) {
      const medicationRecord = await this.medicationRecordRepository.findOne({
        where: { patientId, stage },
      });

      if (medicationRecord) {
        completedRequirements.push({
          type: 'medicationRecord',
          name: '用药记录',
        });
      } else {
        missingRequirements.push({
          type: 'medicationRecord',
          message: '需要填写用药记录',
        });
      }
    }

    // 检查合并用药
    if (requirements.requiresConcomitantMeds) {
      const concomitantMed = await this.concomitantMedicationRepository.findOne(
        {
          where: { patientId, stage: stage as 'V2' | 'V3' | 'V4' },
        },
      );

      if (concomitantMed) {
        completedRequirements.push({
          type: 'concomitantMedication',
          name: '合并用药记录',
        });
      } else {
        missingRequirements.push({
          type: 'concomitantMedication',
          message: '需要填写合并用药记录',
        });
      }
    }

    return {
      canComplete: missingRequirements.length === 0,
      missingRequirements,
      completedRequirements,
    };
  }
}
