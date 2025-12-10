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

    // 计算所有阶段的时间窗口（基于入组日期）
    const enrollmentDate = new Date();
    const timeWindows = this.calculateAllTimeWindows(enrollmentDate);

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
      enrollmentDate,
      // 设置所有时间窗口
      v2WindowStart: timeWindows.v2.start,
      v2WindowEnd: timeWindows.v2.end,
      v3WindowStart: timeWindows.v3.start,
      v3WindowEnd: timeWindows.v3.end,
      v4WindowStart: timeWindows.v4.start,
      v4WindowEnd: timeWindows.v4.end,
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
   * 计算所有阶段的时间窗口（基于入组日期）
   * 时间窗口是累积计算的：
   * - V2窗口 = 入组日期 + V1_TO_V2_DAYS (±容差)
   * - V3窗口 = V2窗口开始 + V2_TO_V3_DAYS (±容差)
   * - V4窗口 = V3窗口开始 + V3_TO_V4_DAYS (±容差)
   */
  calculateAllTimeWindows(enrollmentDate: Date) {
    const enrollment = new Date(enrollmentDate);
    enrollment.setHours(0, 0, 0, 0);

    // V2时间窗口：入组后第6-8天 (7天±1天)
    const v2Start = new Date(enrollment);
    v2Start.setDate(v2Start.getDate() + STAGE_CONFIG.V1_TO_V2_DAYS - STAGE_CONFIG.V1_TO_V2_TOLERANCE);
    const v2End = new Date(enrollment);
    v2End.setDate(v2End.getDate() + STAGE_CONFIG.V1_TO_V2_DAYS + STAGE_CONFIG.V1_TO_V2_TOLERANCE);

    // V3时间窗口：V2窗口开始 + 21天±2天 = 入组后第25-31天
    const v3Start = new Date(v2Start);
    v3Start.setDate(v3Start.getDate() + STAGE_CONFIG.V2_TO_V3_DAYS - STAGE_CONFIG.V2_TO_V3_TOLERANCE);
    const v3End = new Date(v2Start);
    v3End.setDate(v3End.getDate() + STAGE_CONFIG.V2_TO_V3_DAYS + STAGE_CONFIG.V2_TO_V3_TOLERANCE);

    // V4时间窗口：V3窗口开始 + 7天±2天
    const v4Start = new Date(v3Start);
    v4Start.setDate(v4Start.getDate() + STAGE_CONFIG.V3_TO_V4_DAYS - STAGE_CONFIG.V3_TO_V4_TOLERANCE);
    const v4End = new Date(v3Start);
    v4End.setDate(v4End.getDate() + STAGE_CONFIG.V3_TO_V4_DAYS + STAGE_CONFIG.V3_TO_V4_TOLERANCE);

    return {
      v2: { start: v2Start, end: v2End },
      v3: { start: v3Start, end: v3End },
      v4: { start: v4Start, end: v4End },
    };
  }

  /**
   * 根据时间计算患者应该处于的阶段
   * 纯时间驱动，不考虑审核状态
   */
  calculateCurrentStageByTime(patient: Patient): 'V1' | 'V2' | 'V3' | 'V4' | 'completed' {
    // 已完成的患者不再变更
    if (patient.status === 'completed' || patient.currentStage === 'completed') {
      return 'completed';
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 根据时间窗口判断当前应处于的阶段
    if (patient.v4WindowStart && now >= new Date(patient.v4WindowStart)) {
      return 'V4';
    }
    if (patient.v3WindowStart && now >= new Date(patient.v3WindowStart)) {
      return 'V3';
    }
    if (patient.v2WindowStart && now >= new Date(patient.v2WindowStart)) {
      return 'V2';
    }
    return 'V1';
  }

  /**
   * 同步患者阶段（根据时间更新currentStage）
   * 在获取患者信息时调用，确保阶段与时间同步
   */
  async syncPatientStage(patient: Patient): Promise<Patient> {
    if (patient.status === 'completed') {
      return patient;
    }

    const calculatedStage = this.calculateCurrentStageByTime(patient);

    if (calculatedStage !== patient.currentStage) {
      patient.currentStage = calculatedStage;
      patient.pendingReview = false; // 阶段变更时重置待审核状态
      await this.patientRepository.save(patient);
      console.log(`[阶段同步] 患者ID: ${patient.id}, 阶段从数据库值更新为: ${calculatedStage}`);
    }

    return patient;
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

    // 同步所有患者的阶段状态
    for (const patient of list) {
      await this.syncPatientStage(patient);
    }

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

    // 同步阶段状态
    return await this.syncPatientStage(patient);
  }

  /**
   * 根据用户ID获取患者信息
   */
  async findByUserId(userId: number): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: { userId },
      relations: ['user', 'doctor', 'doctor.user', 'hospital'],
    });

    if (patient) {
      return await this.syncPatientStage(patient);
    }
    return null;
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
   * 审核V1阶段（时间驱动模式：只标记完成状态，不推进阶段）
   * 阶段推进由时间窗口自动控制
   */
  async completeV1(id: number, completeV1Dto: CompleteV1Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V1的患者才能审核V1
    if (patient.currentStage !== 'V1') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法审核V1`,
      );
    }

    // 如果是驳回,只保存审核意见
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

    // 只记录V1完成时间，不修改currentStage（阶段由时间驱动）
    patient.v1CompletedAt = new Date();
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息
    await this.pushMessageService.createAuditResultMessage(
      patient.userId,
      'V1',
      'approved',
      completeV1Dto.reviewNotes || 'V1阶段审核通过',
    );

    return savedPatient;
  }

  /**
   * 审核V2阶段（时间驱动模式：只标记完成状态，不推进阶段）
   */
  async completeV2(id: number, completeV2Dto: CompleteV2Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V2的患者才能审核V2
    if (patient.currentStage !== 'V2') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法审核V2`,
      );
    }

    // 如果是驳回,只保存审核意见
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

    // 只记录V2完成时间，不修改currentStage（阶段由时间驱动）
    patient.v2CompletedAt = new Date();
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息
    await this.pushMessageService.createAuditResultMessage(
      patient.userId,
      'V2',
      'approved',
      completeV2Dto.reviewNotes || 'V2阶段审核通过',
    );

    return savedPatient;
  }

  /**
   * 审核V3阶段（时间驱动模式：只标记完成状态，不推进阶段）
   */
  async completeV3(id: number, completeV3Dto: CompleteV3Dto): Promise<Patient> {
    const patient = await this.findOne(id);

    // 只有当前阶段为V3的患者才能审核V3
    if (patient.currentStage !== 'V3') {
      throw new BadRequestException(
        `患者当前阶段为 ${patient.currentStage},无法审核V3`,
      );
    }

    // 如果是驳回,只保存审核意见
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

    // 只记录V3完成时间，不修改currentStage（阶段由时间驱动）
    patient.v3CompletedAt = new Date();
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送审核通过消息
    await this.pushMessageService.createAuditResultMessage(
      patient.userId,
      'V3',
      'approved',
      completeV3Dto.reviewNotes || 'V3阶段审核通过',
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
   * 手动推进阶段（用于测试或特殊情况）
   * 跳过必填项检查，直接推进到目标阶段
   */
  async advanceStage(
    patientId: number,
    targetStage: 'V2' | 'V3' | 'V4' | 'completed',
    remark?: string,
  ): Promise<Patient> {
    const patient = await this.findOne(patientId);

    const stageOrder = ['V1', 'V2', 'V3', 'V4', 'completed'];
    const currentIndex = stageOrder.indexOf(patient.currentStage);
    const targetIndex = stageOrder.indexOf(targetStage);

    if (targetIndex <= currentIndex) {
      throw new BadRequestException(
        `目标阶段 ${targetStage} 必须在当前阶段 ${patient.currentStage} 之后`,
      );
    }

    const now = new Date();

    // 根据目标阶段更新相应的完成时间和时间窗口
    if (currentIndex < 1 && targetIndex >= 1) {
      // 需要完成V1
      patient.v1CompletedAt = now;
      patient.v2WindowStart = now;
      patient.v2WindowEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // +2天
    }
    if (currentIndex < 2 && targetIndex >= 2) {
      // 需要完成V2
      patient.v2CompletedAt = now;
      patient.v3WindowStart = now;
      patient.v3WindowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // +4天
    }
    if (currentIndex < 3 && targetIndex >= 3) {
      // 需要完成V3
      patient.v3CompletedAt = now;
      patient.v4WindowStart = now;
      patient.v4WindowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // +4天
    }
    if (targetIndex === 4) {
      // 完成V4
      patient.v4CompletedAt = now;
      patient.status = 'completed';
    }

    patient.currentStage = targetStage;
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    console.log(`[手动推进阶段] 患者ID: ${patientId}, 从 ${stageOrder[currentIndex]} 推进到 ${targetStage}, 备注: ${remark || '无'}`);

    return savedPatient;
  }

  /**
   * 检查提前退出条件
   * 提前退出需要完成4个量表: AIS, ESS, GAD7, PHQ9
   */
  async checkWithdrawRequirements(patientId: number) {
    const patient = await this.findOne(patientId);

    if (patient.status === 'withdrawn') {
      return {
        canWithdraw: false,
        missingScales: [],
        completedScales: [],
        message: '患者已经退出',
      };
    }

    if (patient.status === 'completed') {
      return {
        canWithdraw: false,
        missingScales: [],
        completedScales: [],
        message: '患者已完成所有阶段，无需退出',
      };
    }

    // 提前退出需要完成的量表
    const requiredScales = ['AIS', 'ESS', 'GAD7', 'PHQ9'];
    const missingScales: string[] = [];
    const completedScales: string[] = [];

    // 检查当前阶段的量表是否完成
    const stage = patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4';

    for (const scaleCode of requiredScales) {
      const scaleConfig = await this.scaleConfigRepository.findOne({
        where: { code: scaleCode as any },
      });

      if (!scaleConfig) {
        missingScales.push(scaleCode);
        continue;
      }

      const scaleRecord = await this.scaleRecordRepository.findOne({
        where: { patientId, stage, scaleId: scaleConfig.id },
      });

      if (scaleRecord) {
        completedScales.push(scaleCode);
      } else {
        missingScales.push(scaleCode);
      }
    }

    const canWithdraw = missingScales.length === 0;

    return {
      canWithdraw,
      missingScales,
      completedScales,
      message: canWithdraw
        ? '可以提前退出'
        : `需要先完成以下量表: ${missingScales.join('、')}`,
    };
  }

  /**
   * 患者提前退出
   * 退出前必须完成4个量表: AIS, ESS, GAD7, PHQ9
   */
  async withdrawPatient(patientId: number, reason: string): Promise<Patient> {
    const patient = await this.findOne(patientId);

    if (patient.status === 'withdrawn') {
      throw new BadRequestException('患者已经退出');
    }

    if (patient.status === 'completed') {
      throw new BadRequestException('患者已完成所有阶段，无需退出');
    }

    // 检查是否满足退出条件
    const checkResult = await this.checkWithdrawRequirements(patientId);
    if (!checkResult.canWithdraw) {
      throw new BadRequestException(checkResult.message);
    }

    // 记录退出信息
    patient.status = 'withdrawn';
    patient.withdrawnAt = new Date();
    patient.withdrawReason = reason;
    patient.withdrawStage = patient.currentStage as 'V1' | 'V2' | 'V3' | 'V4';
    patient.pendingReview = false;

    const savedPatient = await this.patientRepository.save(patient);

    // 发送退出通知给医生
    const doctor = await this.doctorRepository.findOne({
      where: { id: patient.doctorId },
    });
    if (doctor) {
      await this.pushMessageService.sendPushAsync(doctor.userId, {
        userId: doctor.userId,
        type: 'system_notice',
        title: '患者提前退出通知',
        content: `患者 ${patient.user?.name || '未知'} 已在${this.getStageDisplayName(patient.withdrawStage)}阶段提前退出。退出原因：${reason}`,
        data: {
          patientId: patient.id,
          navigateTo: '/pages/doctor/patient-detail',
        },
      });
    }

    console.log(`[提前退出] 患者ID: ${patientId}, 退出阶段: ${patient.withdrawStage}, 原因: ${reason}`);

    return savedPatient;
  }

  /**
   * 获取阶段显示名称
   */
  private getStageDisplayName(stage: string): string {
    const stageNames: Record<string, string> = {
      V1: '第一阶段(V1)',
      V2: '第二阶段(V2)',
      V3: '第三阶段(V3)',
      V4: '第四阶段(V4)',
      completed: '已完成',
    };
    return stageNames[stage] || stage;
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
