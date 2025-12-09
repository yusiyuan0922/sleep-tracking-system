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
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import {
  RegisterPatientDto,
  QueryPatientDto,
  UpdatePatientStatusDto,
  CompleteV1Dto,
  CompleteV2Dto,
  CompleteV3Dto,
} from './dto/patient.dto';
import { STAGE_REQUIREMENTS, STAGE_CONFIG } from '../../common/constants/stages';
import { getStageRequirementsDescription } from '../../../../shared/constants/stages';
import { PushMessageService } from '../push-message/push-message.service';

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
    private readonly pushMessageService: PushMessageService,
  ) {}

  /**
   * 患者注册(患者自助注册)
   */
  async register(registerPatientDto: RegisterPatientDto, userId: number): Promise<Patient> {
    const {
      name,
      gender,
      birthDate,
      phone,
      emergencyContact,
      emergencyPhone,
      doctorId,
      hospitalId,
      diagnosis,
    } = registerPatientDto;

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

    // 检查手机号是否已被其他用户使用
    if (phone && phone !== user.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('该手机号已被使用');
      }
    }

    // 更新User表的基本信息
    user.name = name;
    user.gender = gender;
    user.birthDate = new Date(birthDate);
    user.phone = phone;
    await this.userRepository.save(user);

    // 生成患者编号 (格式: P + 时间戳后8位 + 随机3位数)
    const patientNo = this.generatePatientNo();

    // 创建患者记录
    const patient = this.patientRepository.create({
      userId,
      doctorId,
      hospitalId,
      patientNo,
      emergencyContact,
      emergencyPhone,
      diagnosis,
      currentStage: 'V1',
      status: 'active',
    });

    const savedPatient = await this.patientRepository.save(patient);

    // 发送推送消息
    // 1. 通知患者注册成功
    await this.pushMessageService.notifyPatientRegistered(userId, name);

    // 2. 通知医生有新患者分配
    await this.pushMessageService.notifyDoctorNewPatient(
      doctor.userId,
      name,
      savedPatient.id,
    );

    return savedPatient;
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

    // 如果是驳回,只保存审核意见,不修改阶段状态
    if (completeV1Dto.reviewDecision === 'rejected') {
      patient.pendingReview = false;
      const savedPatient = await this.patientRepository.save(patient);

      // 发送审核驳回消息
      await this.pushMessageService.createAuditResultMessage(
        patient.userId,
        'V1',
        'rejected',
        completeV1Dto.reviewNotes,
      );

      return savedPatient;
    }

    // 检查是否满足V1阶段完成条件
    const checkResult = await this.checkStageRequirements(id, 'V1');
    if (!checkResult.canComplete) {
      const missingItems = checkResult.missingRequirements
        .map(item => item.name || item.message)
        .join('、');
      throw new BadRequestException(
        `V1阶段未满足完成条件，缺少：${missingItems}`,
      );
    }

    // 更新V1完成时间
    patient.v1CompletedAt = new Date();

    // 自动计算V2时间窗口(如果未提供)
    if (completeV1Dto.v2WindowStart && completeV1Dto.v2WindowEnd) {
      patient.v2WindowStart = new Date(completeV1Dto.v2WindowStart);
      patient.v2WindowEnd = new Date(completeV1Dto.v2WindowEnd);
    } else {
      const v1Date = patient.v1CompletedAt;
      const v2Start = new Date(v1Date);
      v2Start.setDate(v2Start.getDate() + STAGE_CONFIG.V1_TO_V2_DAYS - STAGE_CONFIG.V1_TO_V2_TOLERANCE);

      const v2End = new Date(v1Date);
      v2End.setDate(v2End.getDate() + STAGE_CONFIG.V1_TO_V2_DAYS + STAGE_CONFIG.V1_TO_V2_TOLERANCE);

      patient.v2WindowStart = v2Start;
      patient.v2WindowEnd = v2End;
    }

    patient.currentStage = 'V2';
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息,包含V2阶段必填项
    const v2Requirements = getStageRequirementsDescription('V2');
    await this.pushMessageService.notifyPatientStageApproved(
      patient.userId,
      'V1',
      'V2',
      v2Requirements,
    );

    return savedPatient;
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

    // 如果是驳回,只保存审核意见,不修改阶段状态
    if (completeV2Dto.reviewDecision === 'rejected') {
      patient.pendingReview = false;
      const savedPatient = await this.patientRepository.save(patient);

      // 发送审核驳回消息
      await this.pushMessageService.createAuditResultMessage(
        patient.userId,
        'V2',
        'rejected',
        completeV2Dto.reviewNotes,
      );

      return savedPatient;
    }

    // 检查是否满足V2阶段完成条件
    const checkResult = await this.checkStageRequirements(id, 'V2');
    if (!checkResult.canComplete) {
      const missingItems = checkResult.missingRequirements
        .map(item => item.name || item.message)
        .join('、');
      throw new BadRequestException(
        `V2阶段未满足完成条件，缺少：${missingItems}`,
      );
    }

    // 更新V2完成时间
    patient.v2CompletedAt = new Date();

    // 自动计算V3时间窗口(如果未提供)
    if (completeV2Dto.v3WindowStart && completeV2Dto.v3WindowEnd) {
      patient.v3WindowStart = new Date(completeV2Dto.v3WindowStart);
      patient.v3WindowEnd = new Date(completeV2Dto.v3WindowEnd);
    } else {
      const v2Date = patient.v2CompletedAt;
      const v3Start = new Date(v2Date);
      v3Start.setDate(v3Start.getDate() + STAGE_CONFIG.V2_TO_V3_DAYS - STAGE_CONFIG.V2_TO_V3_TOLERANCE);

      const v3End = new Date(v2Date);
      v3End.setDate(v3End.getDate() + STAGE_CONFIG.V2_TO_V3_DAYS + STAGE_CONFIG.V2_TO_V3_TOLERANCE);

      patient.v3WindowStart = v3Start;
      patient.v3WindowEnd = v3End;
    }

    patient.currentStage = 'V3';
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息,包含V3阶段必填项
    const v3Requirements = getStageRequirementsDescription('V3');
    await this.pushMessageService.notifyPatientStageApproved(
      patient.userId,
      'V2',
      'V3',
      v3Requirements,
    );

    return savedPatient;
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

    // 如果是驳回,只保存审核意见,不修改阶段状态
    if (completeV3Dto.reviewDecision === 'rejected') {
      patient.pendingReview = false;
      const savedPatient = await this.patientRepository.save(patient);

      // 发送审核驳回消息
      await this.pushMessageService.createAuditResultMessage(
        patient.userId,
        'V3',
        'rejected',
        completeV3Dto.reviewNotes,
      );

      return savedPatient;
    }

    // 检查是否满足V3阶段完成条件
    const checkResult = await this.checkStageRequirements(id, 'V3');
    if (!checkResult.canComplete) {
      const missingItems = checkResult.missingRequirements
        .map(item => item.name || item.message)
        .join('、');
      throw new BadRequestException(
        `V3阶段未满足完成条件，缺少：${missingItems}`,
      );
    }

    // 更新V3完成时间
    patient.v3CompletedAt = new Date();

    // 自动计算V4时间窗口(如果未提供)
    if (completeV3Dto.v4WindowStart && completeV3Dto.v4WindowEnd) {
      patient.v4WindowStart = new Date(completeV3Dto.v4WindowStart);
      patient.v4WindowEnd = new Date(completeV3Dto.v4WindowEnd);
    } else {
      const v3Date = patient.v3CompletedAt;
      const v4Start = new Date(v3Date);
      v4Start.setDate(v4Start.getDate() + STAGE_CONFIG.V3_TO_V4_DAYS - STAGE_CONFIG.V3_TO_V4_TOLERANCE);

      const v4End = new Date(v3Date);
      v4End.setDate(v4End.getDate() + STAGE_CONFIG.V3_TO_V4_DAYS + STAGE_CONFIG.V3_TO_V4_TOLERANCE);

      patient.v4WindowStart = v4Start;
      patient.v4WindowEnd = v4End;
    }

    patient.currentStage = 'V4';
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息,包含V4阶段必填项
    const v4Requirements = getStageRequirementsDescription('V4');
    await this.pushMessageService.notifyPatientStageApproved(
      patient.userId,
      'V3',
      'V4',
      v4Requirements,
    );

    return savedPatient;
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

    // 检查是否满足V4阶段完成条件
    const checkResult = await this.checkStageRequirements(id, 'V4');
    if (!checkResult.canComplete) {
      const missingItems = checkResult.missingRequirements
        .map(item => item.name || item.message)
        .join('、');
      throw new BadRequestException(
        `V4阶段未满足完成条件，缺少：${missingItems}`,
      );
    }

    // 更新V4完成时间,阶段和状态
    patient.v4CompletedAt = new Date();
    patient.currentStage = 'completed';
    patient.status = 'completed';

    const savedPatient = await this.patientRepository.save(patient);

    // 发送完成所有阶段的消息
    await this.pushMessageService.sendPushAsync(patient.userId, {
      userId: patient.userId,
      type: 'system_notice',
      title: '恭喜完成全部阶段',
      content: '您已成功完成所有治疗阶段!感谢您的配合和坚持。',
      data: {
        navigateTo: '/pages/profile/index',
      },
    });

    return savedPatient;
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

  /**
   * 检查患者部分的完成度（不包括医生代填项）
   * 用于判断是否可以进入"待审核"状态
   */
  async checkPatientRequirements(patientId: number, stage: 'V1' | 'V2' | 'V3' | 'V4') {
    const requirements = STAGE_REQUIREMENTS[stage];
    const missingRequirements: Array<{ type: string; code?: string; name?: string; message?: string }> = [];
    const completedRequirements: Array<{ type: string; code?: string; name?: string; recordId?: number }> = [];

    // 检查患者自填量表
    for (const scaleCode of requirements.patientScales) {
      const scaleConfig = await this.scaleConfigRepository.findOne({
        where: { code: scaleCode as any },
      });

      if (!scaleConfig) {
        missingRequirements.push({
          type: 'scale',
          code: scaleCode,
          name: `${scaleCode}量表`,
          message: '量表配置不存在'
        });
        continue;
      }

      const scaleRecord = await this.scaleRecordRepository.findOne({
        where: { patientId, stage, scaleId: scaleConfig.id },
      });

      if (scaleRecord) {
        completedRequirements.push({
          type: 'scale',
          code: scaleCode,
          name: `${scaleCode}量表`,
          recordId: scaleRecord.id,
        });
      } else {
        missingRequirements.push({ type: 'scale', code: scaleCode, name: `${scaleCode}量表` });
      }
    }

    // 检查用药记录
    if (requirements.requiresMedicationRecord) {
      const medicationRecord = await this.medicationRecordRepository.findOne({
        where: { patientId, stage },
      });

      if (medicationRecord) {
        completedRequirements.push({ type: 'medicationRecord', name: '用药记录' });
      } else {
        missingRequirements.push({ type: 'medicationRecord', message: '需要填写用药记录' });
      }
    }

    // 检查合并用药
    if (requirements.requiresConcomitantMeds) {
      const concomitantMed = await this.concomitantMedicationRepository.findOne({
        where: { patientId, stage: stage as 'V2' | 'V3' | 'V4' },
      });

      if (concomitantMed) {
        completedRequirements.push({ type: 'concomitantMedication', name: '合并用药记录' });
      } else {
        missingRequirements.push({ type: 'concomitantMedication', message: '需要填写合并用药记录' });
      }
    }

    return {
      patientPartCompleted: missingRequirements.length === 0,
      missingRequirements,
      completedRequirements,
    };
  }

  /**
   * 检查阶段是否满足完成条件（包括所有项：患者+医生）
   */
  async checkStageRequirements(patientId: number, stage: 'V1' | 'V2' | 'V3' | 'V4') {
    const requirements = STAGE_REQUIREMENTS[stage];
    const missingRequirements: Array<{ type: string; code?: string; name?: string; message?: string }> = [];
    const completedRequirements: Array<{ type: string; code?: string; name?: string; recordId?: number }> = [];

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
          message: '量表配置不存在'
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
          recordId: scaleRecord.id,
        });
      } else {
        missingRequirements.push({ type: 'scale', code: scaleCode, name: `${scaleCode}量表` });
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
        missingRequirements.push({ type: 'medicalFile', message: '需要上传病历文件' });
      }
    }

    // 检查用药记录
    if (requirements.requiresMedicationRecord) {
      const medicationRecord = await this.medicationRecordRepository.findOne({
        where: { patientId, stage },
      });

      if (medicationRecord) {
        completedRequirements.push({ type: 'medicationRecord', name: '用药记录' });
      } else {
        missingRequirements.push({ type: 'medicationRecord', message: '需要填写用药记录' });
      }
    }

    // 检查合并用药
    if (requirements.requiresConcomitantMeds) {
      const concomitantMed = await this.concomitantMedicationRepository.findOne({
        where: { patientId, stage: stage as 'V2' | 'V3' | 'V4' },
      });

      if (concomitantMed) {
        completedRequirements.push({ type: 'concomitantMedication', name: '合并用药记录' });
      } else {
        missingRequirements.push({ type: 'concomitantMedication', message: '需要填写合并用药记录' });
      }
    }

    return {
      canComplete: missingRequirements.length === 0,
      missingRequirements,
      completedRequirements,
    };
  }

  /**
   * 获取患者阶段完成状态
   */
  async getStageCompletionStatus(id: number) {
    const patient = await this.findOne(id);

    if (patient.currentStage === 'completed') {
      return {
        currentStage: 'completed',
        canComplete: false,
        message: '患者已完成所有阶段',
        requirements: {
          requiredScales: [],
          requiresMedicalFiles: false,
          requiresMedicationRecord: false,
        },
        missingRequirements: [],
        completedRequirements: [],
      };
    }

    const stage = patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4';
    const requirements = STAGE_REQUIREMENTS[stage];

    // 使用患者部分检查方法，只检查患者需要完成的项目
    const patientCheckResult = await this.checkPatientRequirements(id, stage);

    return {
      currentStage: patient.currentStage,
      requirements: {
        // 只显示患者需要填写的量表（不包括医生代填的HAMA/HAMD）
        requiredScales: requirements.patientScales,
        requiresMedicalFiles: false, // 病历文件由医生上传，患者端不显示
        requiresMedicationRecord: requirements.requiresMedicationRecord,
        // 合并用药不作为必填项，不在待完成任务中显示
      },
      // 患者完成自己的部分后，canComplete为true，即可提交审核
      canComplete: patientCheckResult.patientPartCompleted,
      missingRequirements: patientCheckResult.missingRequirements,
      completedRequirements: patientCheckResult.completedRequirements,
    };
  }

  /**
   * 检查并更新患者待审核状态
   * 在患者提交任何记录后调用此方法
   */
  async updatePendingReviewStatus(patientId: number): Promise<void> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient || patient.currentStage === 'completed') {
      return;
    }

    const stage = patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4';
    const checkResult = await this.checkPatientRequirements(patientId, stage);

    // 如果患者完成了所有自填项，设置为待审核
    if (checkResult.patientPartCompleted && !patient.pendingReview) {
      patient.pendingReview = true;
      await this.patientRepository.save(patient);
    }
  }

  /**
   * 患者提交当前阶段资料进行审核
   * 只设置 pendingReview = true，不改变阶段
   */
  async submitForReview(patientId: number): Promise<any> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException(`患者 ID ${patientId} 不存在`);
    }

    if (patient.currentStage === 'completed') {
      throw new BadRequestException('患者已完成所有阶段');
    }

    if (patient.pendingReview) {
      throw new BadRequestException('当前阶段已提交审核，请等待医生审核');
    }

    // 检查患者是否完成了当前阶段的所有必填项
    const stage = patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4';
    const checkResult = await this.getStageCompletionStatus(patientId);

    if (!checkResult.canComplete) {
      throw new BadRequestException(
        `请先完成当前阶段的所有必填项: ${checkResult.missingRequirements?.map((r: any) => r.name).join(', ')}`,
      );
    }

    // 设置待审核状态
    patient.pendingReview = true;
    await this.patientRepository.save(patient);

    // 通知医生有患者提交审核
    const doctor = await this.doctorRepository.findOne({
      where: { id: patient.doctorId },
    });
    if (doctor) {
      await this.pushMessageService.notifyDoctorPatientSubmittedReview(
        doctor.userId,
        patient.user.name,
        patient.currentStage,
        patient.id,
      );
    }

    return {
      message: '提交成功，请等待医生审核',
      currentStage: patient.currentStage,
      pendingReview: true,
    };
  }
}
