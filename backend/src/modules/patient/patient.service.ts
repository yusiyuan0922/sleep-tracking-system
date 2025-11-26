import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../database/entities/patient.entity';
import { User } from '../../database/entities/user.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import {
  RegisterPatientDto,
  QueryPatientDto,
  UpdatePatientStatusDto,
  CompleteV1Dto,
  CompleteV2Dto,
  CompleteV3Dto,
} from './dto/patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  /**
   * 患者注册(医生为患者注册)
   */
  async register(registerPatientDto: RegisterPatientDto): Promise<Patient> {
    const { userId, doctorId, hospitalId } = registerPatientDto;

    // 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户角色是否为patient
    if (user.role !== 'patient') {
      throw new BadRequestException('该用户不是患者角色');
    }

    // 检查该用户是否已经注册为患者
    const existingPatient = await this.patientRepository.findOne({
      where: { userId },
    });
    if (existingPatient) {
      throw new ConflictException('该用户已注册为患者');
    }

    // 检查医生是否存在且审核通过
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });
    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }
    if (doctor.auditStatus !== 'approved') {
      throw new BadRequestException('该医生审核状态不是已通过,无法为患者注册');
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

    // 生成患者编号 (格式: P + 时间戳后8位 + 随机3位数)
    const patientNo = this.generatePatientNo();

    // 创建患者记录
    const patient = this.patientRepository.create({
      userId,
      doctorId,
      hospitalId,
      patientNo,
      currentStage: 'V1',
      status: 'active',
    });

    return await this.patientRepository.save(patient);
  }

  /**
   * 生成患者编号
   */
  private generatePatientNo(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `P${timestamp}${random}`;
  }

  /**
   * 查询患者列表(分页+筛选)
   */
  async findAll(query: QueryPatientDto) {
    const {
      doctorId,
      hospitalId,
      currentStage,
      status,
      name,
      patientNo,
      page = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('patient.hospital', 'hospital');

    // 按医生筛选
    if (doctorId) {
      queryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId });
    }

    // 按医院筛选
    if (hospitalId) {
      queryBuilder.andWhere('patient.hospitalId = :hospitalId', {
        hospitalId,
      });
    }

    // 按当前阶段筛选
    if (currentStage) {
      queryBuilder.andWhere('patient.currentStage = :currentStage', {
        currentStage,
      });
    }

    // 按状态筛选
    if (status) {
      queryBuilder.andWhere('patient.status = :status', { status });
    }

    // 按患者姓名模糊搜索
    if (name) {
      queryBuilder.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }

    // 按患者编号搜索
    if (patientNo) {
      queryBuilder.andWhere('patient.patientNo = :patientNo', { patientNo });
    }

    // 排序和分页
    queryBuilder
      .orderBy('patient.createdAt', 'DESC')
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
   * 获取患者详情
   */
  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['user', 'doctor', 'doctor.user', 'hospital'],
    });

    if (!patient) {
      throw new NotFoundException(`患者ID ${id} 不存在`);
    }

    return patient;
  }

  /**
   * 根据用户ID获取患者信息
   */
  async findByUserId(userId: number): Promise<Patient | null> {
    return await this.patientRepository.findOne({
      where: { userId },
      relations: ['user', 'doctor', 'doctor.user', 'hospital'],
    });
  }

  /**
   * 更新患者状态
   */
  async updateStatus(
    id: number,
    updatePatientStatusDto: UpdatePatientStatusDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    patient.status = updatePatientStatusDto.status;

    // 如果状态改为completed,更新当前阶段
    if (updatePatientStatusDto.status === 'completed') {
      patient.currentStage = 'completed';
    }

    return await this.patientRepository.save(patient);
  }

  /**
   * 完成V1阶段,设置V2时间窗口
   */
  async completeV1(id: number, completeV1Dto: CompleteV1Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V1的患者才能完成V1
    if (patient.currentStage !== 'V1') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法完成V1`,
      );
    }

    // 更新V1完成时间和V2时间窗口
    patient.v1CompletedAt = new Date();
    patient.v2WindowStart = new Date(completeV1Dto.v2WindowStart);
    patient.v2WindowEnd = new Date(completeV1Dto.v2WindowEnd);
    patient.currentStage = 'V2';

    return await this.patientRepository.save(patient);
  }

  /**
   * 完成V2阶段,设置V3时间窗口
   */
  async completeV2(id: number, completeV2Dto: CompleteV2Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V2的患者才能完成V2
    if (patient.currentStage !== 'V2') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法完成V2`,
      );
    }

    // 更新V2完成时间和V3时间窗口
    patient.v2CompletedAt = new Date();
    patient.v3WindowStart = new Date(completeV2Dto.v3WindowStart);
    patient.v3WindowEnd = new Date(completeV2Dto.v3WindowEnd);
    patient.currentStage = 'V3';

    return await this.patientRepository.save(patient);
  }

  /**
   * 完成V3阶段,设置V4时间窗口
   */
  async completeV3(id: number, completeV3Dto: CompleteV3Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V3的患者才能完成V3
    if (patient.currentStage !== 'V3') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法完成V3`,
      );
    }

    // 更新V3完成时间和V4时间窗口
    patient.v3CompletedAt = new Date();
    patient.v4WindowStart = new Date(completeV3Dto.v4WindowStart);
    patient.v4WindowEnd = new Date(completeV3Dto.v4WindowEnd);
    patient.currentStage = 'V4';

    return await this.patientRepository.save(patient);
  }

  /**
   * 完成V4阶段
   */
  async completeV4(id: number): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V4的患者才能完成V4
    if (patient.currentStage !== 'V4') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法完成V4`,
      );
    }

    // 更新V4完成时间,阶段和状态
    patient.v4CompletedAt = new Date();
    patient.currentStage = 'completed';
    patient.status = 'completed';

    return await this.patientRepository.save(patient);
  }

  /**
   * 获取患者的时间窗口信息
   */
  async getTimeWindows(id: number) {
    const patient = await this.findOne(id);

    return {
      currentStage: patient.currentStage,
      enrollmentDate: patient.enrollmentDate,
      v1CompletedAt: patient.v1CompletedAt,
      v2Window: {
        start: patient.v2WindowStart,
        end: patient.v2WindowEnd,
        completed: patient.v2CompletedAt,
      },
      v3Window: {
        start: patient.v3WindowStart,
        end: patient.v3WindowEnd,
        completed: patient.v3CompletedAt,
      },
      v4Window: {
        start: patient.v4WindowStart,
        end: patient.v4WindowEnd,
        completed: patient.v4CompletedAt,
      },
    };
  }
}
