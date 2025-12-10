import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Patient } from '../../database/entities/patient.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { StageRecord } from '../../database/entities/stage-record.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import {
  ExportFilterDto,
  ExportHospitalDto,
  ExportDoctorDto,
  ExportScaleRecordsDto,
  ExportAdverseEventsDto,
} from './dto/export.dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(ScaleRecord)
    private readonly scaleRecordRepository: Repository<ScaleRecord>,
    @InjectRepository(ScaleConfig)
    private readonly scaleConfigRepository: Repository<ScaleConfig>,
    @InjectRepository(MedicationRecord)
    private readonly medicationRecordRepository: Repository<MedicationRecord>,
    @InjectRepository(ConcomitantMedication)
    private readonly concomitantMedicationRepository: Repository<ConcomitantMedication>,
    @InjectRepository(AdverseEvent)
    private readonly adverseEventRepository: Repository<AdverseEvent>,
    @InjectRepository(MedicalFile)
    private readonly medicalFileRepository: Repository<MedicalFile>,
    @InjectRepository(StageRecord)
    private readonly stageRecordRepository: Repository<StageRecord>,
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  /**
   * 应用 Excel 样式
   */
  private applyStyles(worksheet: ExcelJS.Worksheet) {
    // 冻结首行
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // 表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    // 所有单元格加边框
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  }

  /**
   * 格式化日期时间
   */
  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  /**
   * 格式化性别
   */
  private formatGender(gender: string | null | undefined): string {
    if (gender === 'male') return '男';
    if (gender === 'female') return '女';
    return '';
  }

  /**
   * 格式化阶段
   */
  private formatStage(stage: string | null | undefined): string {
    if (stage === 'completed') return '已完成';
    return stage || '';
  }

  /**
   * 格式化状态
   */
  private formatStatus(status: string | null | undefined): string {
    const statusMap: Record<string, string> = {
      active: '活跃',
      completed: '已完成',
      withdrawn: '退出',
    };
    return statusMap[status || ''] || status || '';
  }

  /**
   * 格式化严重程度
   */
  private formatSeverity(severity: string | null | undefined): string {
    const severityMap: Record<string, string> = {
      mild: '轻度',
      moderate: '中度',
      severe: '重度',
    };
    return severityMap[severity || ''] || severity || '';
  }

  /**
   * 格式化因果关系
   */
  private formatCausality(causality: string | null | undefined): string {
    const causalityMap: Record<string, string> = {
      definite: '肯定有关',
      probable: '很可能有关',
      possible: '可能有关',
      unlikely: '可能无关',
      unrelated: '无关',
    };
    return causalityMap[causality || ''] || causality || '';
  }

  /**
   * 格式化结局
   */
  private formatOutcome(outcome: string | null | undefined): string {
    const outcomeMap: Record<string, string> = {
      recovered: '痊愈',
      recovering: '好转',
      not_recovered: '未好转',
      fatal: '死亡',
      unknown: '未知',
    };
    return outcomeMap[outcome || ''] || outcome || '';
  }

  /**
   * 格式化文件类别
   */
  private formatFileCategory(category: string | null | undefined): string {
    const categoryMap: Record<string, string> = {
      informed_consent: '知情同意书',
      medical_record: '病历',
      lab_report: '检验报告',
      other: '其他',
    };
    return categoryMap[category || ''] || category || '';
  }

  // ==================== 医院维度导出 ====================

  /**
   * 导出医院患者汇总
   */
  async exportHospitalSummary(dto: ExportHospitalDto): Promise<Buffer> {
    const queryBuilder = this.hospitalRepository
      .createQueryBuilder('hospital')
      .where('hospital.status = :status', { status: 'active' });

    if (dto.hospitalId) {
      queryBuilder.andWhere('hospital.id = :hospitalId', { hospitalId: dto.hospitalId });
    }

    const hospitals = await queryBuilder.getMany();

    // 获取每个医院的统计数据
    const summaryData = await Promise.all(
      hospitals.map(async (hospital) => {
        const patients = await this.patientRepository.find({
          where: { hospitalId: hospital.id },
        });

        const aeCount = await this.adverseEventRepository.count({
          where: {
            patient: { hospitalId: hospital.id },
          },
        });

        const saeCount = await this.adverseEventRepository.count({
          where: {
            patient: { hospitalId: hospital.id },
            isSerious: true,
          },
        });

        const stageCount = {
          V1: 0,
          V2: 0,
          V3: 0,
          V4: 0,
          completed: 0,
        };

        patients.forEach((p) => {
          if (p.currentStage && stageCount[p.currentStage] !== undefined) {
            stageCount[p.currentStage]++;
          }
        });

        return {
          hospitalName: hospital.name,
          province: hospital.province || '',
          city: hospital.city || '',
          totalPatients: patients.length,
          v1Count: stageCount.V1,
          v2Count: stageCount.V2,
          v3Count: stageCount.V3,
          v4Count: stageCount.V4,
          completedCount: stageCount.completed,
          aeCount,
          saeCount,
        };
      }),
    );

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('医院患者汇总');

    worksheet.columns = [
      { header: '医院名称', key: 'hospitalName', width: 30 },
      { header: '省份', key: 'province', width: 12 },
      { header: '城市', key: 'city', width: 12 },
      { header: '患者总数', key: 'totalPatients', width: 12 },
      { header: 'V1阶段', key: 'v1Count', width: 10 },
      { header: 'V2阶段', key: 'v2Count', width: 10 },
      { header: 'V3阶段', key: 'v3Count', width: 10 },
      { header: 'V4阶段', key: 'v4Count', width: 10 },
      { header: '已完成', key: 'completedCount', width: 10 },
      { header: '不良事件数', key: 'aeCount', width: 12 },
      { header: '严重不良事件', key: 'saeCount', width: 14 },
    ];

    summaryData.forEach((data) => worksheet.addRow(data));
    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ==================== 医生维度导出 ====================

  /**
   * 导出医生工作量统计
   */
  async exportDoctorSummary(dto: ExportDoctorDto): Promise<Buffer> {
    const queryBuilder = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .where('doctor.auditStatus = :status', { status: 'approved' });

    if (dto.hospitalId) {
      queryBuilder.andWhere('doctor.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      queryBuilder.andWhere('doctor.id = :doctorId', { doctorId: dto.doctorId });
    }

    const doctors = await queryBuilder.getMany();

    // 获取每个医生的统计数据
    const summaryData = await Promise.all(
      doctors.map(async (doctor) => {
        const patientCount = await this.patientRepository.count({
          where: { doctorId: doctor.id },
        });

        const activePatientCount = await this.patientRepository.count({
          where: { doctorId: doctor.id, status: 'active' },
        });

        const completedPatientCount = await this.patientRepository.count({
          where: { doctorId: doctor.id, status: 'completed' },
        });

        // 医生填写的量表记录 (HAMA, HAMD 是医生填写)
        const doctorScaleCount = await this.scaleRecordRepository
          .createQueryBuilder('record')
          .innerJoin('record.scale', 'scale')
          .innerJoin('record.patient', 'patient')
          .where('patient.doctorId = :doctorId', { doctorId: doctor.id })
          .andWhere('scale.type = :type', { type: 'doctor' })
          .getCount();

        // 审核数量
        const auditCount = await this.stageRecordRepository.count({
          where: { auditedBy: doctor.id },
        });

        return {
          doctorName: doctor.user?.name || '',
          hospitalName: doctor.hospital?.name || '',
          department: doctor.department || '',
          title: doctor.title || '',
          totalPatients: patientCount,
          activePatients: activePatientCount,
          completedPatients: completedPatientCount,
          doctorScaleCount,
          auditCount,
        };
      }),
    );

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('医生工作量统计');

    worksheet.columns = [
      { header: '医生姓名', key: 'doctorName', width: 15 },
      { header: '所属医院', key: 'hospitalName', width: 30 },
      { header: '科室', key: 'department', width: 15 },
      { header: '职称', key: 'title', width: 15 },
      { header: '患者总数', key: 'totalPatients', width: 12 },
      { header: '活跃患者', key: 'activePatients', width: 12 },
      { header: '已完成患者', key: 'completedPatients', width: 12 },
      { header: '量表填写数', key: 'doctorScaleCount', width: 12 },
      { header: '审核数', key: 'auditCount', width: 10 },
    ];

    summaryData.forEach((data) => worksheet.addRow(data));
    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ==================== 患者维度导出 ====================

  /**
   * 导出患者列表
   */
  async exportPatientsList(dto: ExportFilterDto): Promise<Buffer> {
    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.hospital', 'hospital')
      .leftJoinAndSelect('patient.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser');

    if (dto.hospitalId) {
      queryBuilder.andWhere('patient.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      queryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId: dto.doctorId });
    }

    if (dto.stage) {
      queryBuilder.andWhere('patient.currentStage = :stage', { stage: dto.stage });
    }

    if (dto.status) {
      queryBuilder.andWhere('patient.status = :status', { status: dto.status });
    }

    if (dto.startDate) {
      queryBuilder.andWhere('patient.enrollmentDate >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('patient.enrollmentDate <= :endDate', { endDate: dto.endDate });
    }

    queryBuilder.orderBy('patient.createdAt', 'DESC');

    const patients = await queryBuilder.getMany();

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('患者列表');

    worksheet.columns = [
      { header: '患者编号', key: 'patientNo', width: 15 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '性别', key: 'gender', width: 8 },
      { header: '出生日期', key: 'birthDate', width: 12 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '医院', key: 'hospital', width: 25 },
      { header: '主治医生', key: 'doctor', width: 12 },
      { header: '当前阶段', key: 'stage', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '入组日期', key: 'enrollmentDate', width: 12 },
      { header: 'V1完成时间', key: 'v1CompletedAt', width: 18 },
      { header: 'V2完成时间', key: 'v2CompletedAt', width: 18 },
      { header: 'V3完成时间', key: 'v3CompletedAt', width: 18 },
      { header: 'V4完成时间', key: 'v4CompletedAt', width: 18 },
    ];

    patients.forEach((patient) => {
      worksheet.addRow({
        patientNo: patient.patientNo,
        name: patient.user?.name || '',
        gender: this.formatGender(patient.user?.gender),
        birthDate: this.formatDate(patient.user?.birthDate),
        phone: patient.user?.phone || '',
        hospital: patient.hospital?.name || '',
        doctor: patient.doctor?.user?.name || '',
        stage: this.formatStage(patient.currentStage),
        status: this.formatStatus(patient.status),
        enrollmentDate: this.formatDate(patient.enrollmentDate),
        v1CompletedAt: this.formatDateTime(patient.v1CompletedAt),
        v2CompletedAt: this.formatDateTime(patient.v2CompletedAt),
        v3CompletedAt: this.formatDateTime(patient.v3CompletedAt),
        v4CompletedAt: this.formatDateTime(patient.v4CompletedAt),
      });
    });

    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出单患者完整档案 (多 Sheet)
   */
  async exportPatientProfile(patientId: number): Promise<Buffer> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user', 'hospital', 'doctor', 'doctor.user'],
    });

    if (!patient) {
      throw new Error('患者不存在');
    }

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: 基本信息
    const basicSheet = workbook.addWorksheet('基本信息');
    basicSheet.columns = [
      { header: '字段', key: 'field', width: 20 },
      { header: '值', key: 'value', width: 40 },
    ];

    const basicInfo = [
      { field: '患者编号', value: patient.patientNo },
      { field: '姓名', value: patient.user?.name || '' },
      { field: '性别', value: this.formatGender(patient.user?.gender) },
      { field: '出生日期', value: this.formatDate(patient.user?.birthDate) },
      { field: '手机号', value: patient.user?.phone || '' },
      { field: '医院', value: patient.hospital?.name || '' },
      { field: '主治医生', value: patient.doctor?.user?.name || '' },
      { field: '当前阶段', value: this.formatStage(patient.currentStage) },
      { field: '状态', value: this.formatStatus(patient.status) },
      { field: '入组日期', value: this.formatDate(patient.enrollmentDate) },
      { field: '紧急联系人', value: patient.emergencyContact || '' },
      { field: '紧急联系电话', value: patient.emergencyPhone || '' },
      { field: '诊断信息', value: patient.diagnosis || '' },
      { field: 'V1完成时间', value: this.formatDateTime(patient.v1CompletedAt) },
      { field: 'V2时间窗口', value: `${this.formatDate(patient.v2WindowStart)} - ${this.formatDate(patient.v2WindowEnd)}` },
      { field: 'V2完成时间', value: this.formatDateTime(patient.v2CompletedAt) },
      { field: 'V3时间窗口', value: `${this.formatDate(patient.v3WindowStart)} - ${this.formatDate(patient.v3WindowEnd)}` },
      { field: 'V3完成时间', value: this.formatDateTime(patient.v3CompletedAt) },
      { field: 'V4时间窗口', value: `${this.formatDate(patient.v4WindowStart)} - ${this.formatDate(patient.v4WindowEnd)}` },
      { field: 'V4完成时间', value: this.formatDateTime(patient.v4CompletedAt) },
    ];

    basicInfo.forEach((info) => basicSheet.addRow(info));
    this.applyStyles(basicSheet);

    // Sheet 2: 量表记录
    const scaleRecords = await this.scaleRecordRepository.find({
      where: { patientId },
      relations: ['scale'],
      order: { stage: 'ASC', completedAt: 'ASC' },
    });

    const scaleSheet = workbook.addWorksheet('量表记录');
    scaleSheet.columns = [
      { header: '阶段', key: 'stage', width: 10 },
      { header: '量表名称', key: 'scaleName', width: 25 },
      { header: '量表代码', key: 'scaleCode', width: 12 },
      { header: '总分', key: 'totalScore', width: 10 },
      { header: '等级', key: 'level', width: 15 },
      { header: '说明', key: 'description', width: 30 },
      { header: '完成时间', key: 'completedAt', width: 20 },
    ];

    scaleRecords.forEach((record) => {
      scaleSheet.addRow({
        stage: record.stage,
        scaleName: record.scale?.name || '',
        scaleCode: record.scale?.code || '',
        totalScore: record.totalScore,
        level: record.level || '',
        description: record.description || '',
        completedAt: this.formatDateTime(record.completedAt),
      });
    });

    this.applyStyles(scaleSheet);

    // Sheet 3: 用药记录
    const medicationRecords = await this.medicationRecordRepository.find({
      where: { patientId },
      order: { stage: 'ASC', createdAt: 'ASC' },
    });

    const concomitantMedications = await this.concomitantMedicationRepository.find({
      where: { patientId },
      order: { createdAt: 'ASC' },
    });

    const medSheet = workbook.addWorksheet('用药记录');
    medSheet.columns = [
      { header: '类型', key: 'type', width: 12 },
      { header: '阶段', key: 'stage', width: 10 },
      { header: '药品名称', key: 'drugName', width: 20 },
      { header: '规格', key: 'specification', width: 15 },
      { header: '剂量', key: 'dosage', width: 10 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '频率', key: 'frequency', width: 12 },
      { header: '用药途径', key: 'route', width: 10 },
      { header: '开始日期', key: 'startDate', width: 12 },
      { header: '结束日期', key: 'endDate', width: 12 },
      { header: '用药原因', key: 'indication', width: 20 },
      { header: '备注', key: 'remark', width: 20 },
    ];

    medicationRecords.forEach((record) => {
      medSheet.addRow({
        type: '试验用药',
        stage: record.stage,
        drugName: record.drugName,
        specification: record.specification || '',
        dosage: record.dosage,
        unit: record.unit || '',
        frequency: record.frequency || '',
        route: record.route || '',
        startDate: this.formatDate(record.startDate),
        endDate: this.formatDate(record.endDate),
        indication: record.indication || '',
        remark: record.remark || '',
      });
    });

    concomitantMedications.forEach((record) => {
      medSheet.addRow({
        type: '合并用药',
        stage: record.stage || '',
        drugName: record.drugName,
        specification: record.specification || '',
        dosage: record.dosage,
        unit: record.unit || '',
        frequency: record.frequency || '',
        route: record.route || '',
        startDate: this.formatDate(record.startDate),
        endDate: this.formatDate(record.endDate),
        indication: record.indication || '',
        remark: record.remark || '',
      });
    });

    this.applyStyles(medSheet);

    // Sheet 4: 不良事件
    const adverseEvents = await this.adverseEventRepository.find({
      where: { patientId },
      order: { onsetDate: 'ASC' },
    });

    const aeSheet = workbook.addWorksheet('不良事件');
    aeSheet.columns = [
      { header: 'AE序号', key: 'aeNumber', width: 12 },
      { header: '阶段', key: 'stage', width: 10 },
      { header: '事件名称', key: 'eventName', width: 20 },
      { header: '严重程度', key: 'severity', width: 10 },
      { header: 'SAE', key: 'isSerious', width: 8 },
      { header: '发生时间', key: 'onsetDate', width: 18 },
      { header: '是否持续', key: 'isOngoing', width: 10 },
      { header: '结束时间', key: 'endDate', width: 18 },
      { header: '相关药物', key: 'relatedDrug', width: 15 },
      { header: '因果关系', key: 'causality', width: 12 },
      { header: '结局', key: 'outcome', width: 10 },
      { header: '描述', key: 'description', width: 30 },
    ];

    adverseEvents.forEach((ae) => {
      aeSheet.addRow({
        aeNumber: ae.aeNumber || '',
        stage: ae.stage,
        eventName: ae.eventName,
        severity: this.formatSeverity(ae.severity),
        isSerious: ae.isSerious ? '是' : '否',
        onsetDate: this.formatDateTime(ae.onsetDate),
        isOngoing: ae.isOngoing ? '是' : '否',
        endDate: this.formatDateTime(ae.endDate),
        relatedDrug: ae.relatedDrug || '',
        causality: this.formatCausality(ae.causality),
        outcome: this.formatOutcome(ae.outcome),
        description: ae.description || '',
      });
    });

    this.applyStyles(aeSheet);

    // Sheet 5: 病历文件
    const medicalFiles = await this.medicalFileRepository.find({
      where: { patientId },
      order: { createdAt: 'ASC' },
    });

    const fileSheet = workbook.addWorksheet('病历文件');
    fileSheet.columns = [
      { header: '阶段', key: 'stage', width: 10 },
      { header: '文件类别', key: 'fileCategory', width: 15 },
      { header: '文件描述', key: 'description', width: 25 },
      { header: '文件名', key: 'fileName', width: 30 },
      { header: '文件类型', key: 'fileType', width: 10 },
      { header: '文件大小', key: 'fileSize', width: 12 },
      { header: '上传时间', key: 'createdAt', width: 18 },
      { header: '文件地址', key: 'fileUrl', width: 50 },
    ];

    medicalFiles.forEach((file) => {
      fileSheet.addRow({
        stage: file.stage,
        fileCategory: this.formatFileCategory(file.fileCategory),
        description: file.description || '',
        fileName: file.fileName || '',
        fileType: file.fileType || '',
        fileSize: file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : '',
        createdAt: this.formatDateTime(file.createdAt),
        fileUrl: file.fileUrl || '',
      });
    });

    this.applyStyles(fileSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出量表记录
   */
  async exportScaleRecords(dto: ExportScaleRecordsDto): Promise<Buffer> {
    const queryBuilder = this.scaleRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.hospital', 'hospital')
      .leftJoinAndSelect('record.scale', 'scale');

    if (dto.patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId: dto.patientId });
    }

    if (dto.hospitalId) {
      queryBuilder.andWhere('patient.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      queryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId: dto.doctorId });
    }

    if (dto.stage) {
      queryBuilder.andWhere('record.stage = :stage', { stage: dto.stage });
    }

    if (dto.scaleCode) {
      queryBuilder.andWhere('scale.code = :scaleCode', { scaleCode: dto.scaleCode });
    }

    if (dto.startDate) {
      queryBuilder.andWhere('record.completedAt >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('record.completedAt <= :endDate', { endDate: `${dto.endDate} 23:59:59` });
    }

    queryBuilder.orderBy('record.completedAt', 'DESC');

    const records = await queryBuilder.getMany();

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('量表记录');

    worksheet.columns = [
      { header: '患者编号', key: 'patientNo', width: 15 },
      { header: '患者姓名', key: 'patientName', width: 12 },
      { header: '医院', key: 'hospital', width: 25 },
      { header: '阶段', key: 'stage', width: 10 },
      { header: '量表名称', key: 'scaleName', width: 25 },
      { header: '量表代码', key: 'scaleCode', width: 12 },
      { header: '总分', key: 'totalScore', width: 10 },
      { header: '等级', key: 'level', width: 15 },
      { header: '说明', key: 'description', width: 30 },
      { header: '完成时间', key: 'completedAt', width: 20 },
    ];

    records.forEach((record) => {
      worksheet.addRow({
        patientNo: record.patient?.patientNo || '',
        patientName: record.patient?.user?.name || '',
        hospital: record.patient?.hospital?.name || '',
        stage: record.stage,
        scaleName: record.scale?.name || '',
        scaleCode: record.scale?.code || '',
        totalScore: record.totalScore,
        level: record.level || '',
        description: record.description || '',
        completedAt: this.formatDateTime(record.completedAt),
      });
    });

    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出用药记录
   */
  async exportMedicationRecords(dto: ExportFilterDto): Promise<Buffer> {
    // 查询主用药记录
    const medQueryBuilder = this.medicationRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.hospital', 'hospital');

    if (dto.patientId) {
      medQueryBuilder.andWhere('record.patientId = :patientId', { patientId: dto.patientId });
    }

    if (dto.hospitalId) {
      medQueryBuilder.andWhere('patient.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      medQueryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId: dto.doctorId });
    }

    if (dto.stage) {
      medQueryBuilder.andWhere('record.stage = :stage', { stage: dto.stage });
    }

    if (dto.startDate) {
      medQueryBuilder.andWhere('record.createdAt >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      medQueryBuilder.andWhere('record.createdAt <= :endDate', { endDate: `${dto.endDate} 23:59:59` });
    }

    medQueryBuilder.orderBy('record.createdAt', 'DESC');
    const medicationRecords = await medQueryBuilder.getMany();

    // 查询合并用药记录
    const conQueryBuilder = this.concomitantMedicationRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.hospital', 'hospital');

    if (dto.patientId) {
      conQueryBuilder.andWhere('record.patientId = :patientId', { patientId: dto.patientId });
    }

    if (dto.hospitalId) {
      conQueryBuilder.andWhere('patient.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      conQueryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId: dto.doctorId });
    }

    if (dto.stage) {
      conQueryBuilder.andWhere('record.stage = :stage', { stage: dto.stage });
    }

    if (dto.startDate) {
      conQueryBuilder.andWhere('record.createdAt >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      conQueryBuilder.andWhere('record.createdAt <= :endDate', { endDate: `${dto.endDate} 23:59:59` });
    }

    conQueryBuilder.orderBy('record.createdAt', 'DESC');
    const concomitantMedications = await conQueryBuilder.getMany();

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用药记录');

    worksheet.columns = [
      { header: '类型', key: 'type', width: 12 },
      { header: '患者编号', key: 'patientNo', width: 15 },
      { header: '患者姓名', key: 'patientName', width: 12 },
      { header: '医院', key: 'hospital', width: 25 },
      { header: '阶段', key: 'stage', width: 10 },
      { header: '药品名称', key: 'drugName', width: 20 },
      { header: '规格', key: 'specification', width: 15 },
      { header: '剂量', key: 'dosage', width: 10 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '频率', key: 'frequency', width: 12 },
      { header: '用药途径', key: 'route', width: 10 },
      { header: '开始日期', key: 'startDate', width: 12 },
      { header: '结束日期', key: 'endDate', width: 12 },
      { header: '用药原因', key: 'indication', width: 20 },
    ];

    medicationRecords.forEach((record) => {
      worksheet.addRow({
        type: '试验用药',
        patientNo: record.patient?.patientNo || '',
        patientName: record.patient?.user?.name || '',
        hospital: record.patient?.hospital?.name || '',
        stage: record.stage,
        drugName: record.drugName,
        specification: record.specification || '',
        dosage: record.dosage,
        unit: record.unit || '',
        frequency: record.frequency || '',
        route: record.route || '',
        startDate: this.formatDate(record.startDate),
        endDate: this.formatDate(record.endDate),
        indication: record.indication || '',
      });
    });

    concomitantMedications.forEach((record) => {
      worksheet.addRow({
        type: '合并用药',
        patientNo: record.patient?.patientNo || '',
        patientName: record.patient?.user?.name || '',
        hospital: record.patient?.hospital?.name || '',
        stage: record.stage || '',
        drugName: record.drugName,
        specification: record.specification || '',
        dosage: record.dosage,
        unit: record.unit || '',
        frequency: record.frequency || '',
        route: record.route || '',
        startDate: this.formatDate(record.startDate),
        endDate: this.formatDate(record.endDate),
        indication: record.indication || '',
      });
    });

    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出不良事件
   */
  async exportAdverseEvents(dto: ExportAdverseEventsDto): Promise<Buffer> {
    const queryBuilder = this.adverseEventRepository
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.hospital', 'hospital');

    if (dto.patientId) {
      queryBuilder.andWhere('ae.patientId = :patientId', { patientId: dto.patientId });
    }

    if (dto.hospitalId) {
      queryBuilder.andWhere('patient.hospitalId = :hospitalId', { hospitalId: dto.hospitalId });
    }

    if (dto.doctorId) {
      queryBuilder.andWhere('patient.doctorId = :doctorId', { doctorId: dto.doctorId });
    }

    if (dto.stage) {
      queryBuilder.andWhere('ae.stage = :stage', { stage: dto.stage });
    }

    if (dto.severity) {
      queryBuilder.andWhere('ae.severity = :severity', { severity: dto.severity });
    }

    if (dto.isSerious !== undefined) {
      queryBuilder.andWhere('ae.isSerious = :isSerious', { isSerious: dto.isSerious });
    }

    if (dto.startDate) {
      queryBuilder.andWhere('ae.onsetDate >= :startDate', { startDate: dto.startDate });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('ae.onsetDate <= :endDate', { endDate: `${dto.endDate} 23:59:59` });
    }

    queryBuilder.orderBy('ae.onsetDate', 'DESC');

    const adverseEvents = await queryBuilder.getMany();

    // 创建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('不良事件');

    worksheet.columns = [
      { header: '患者编号', key: 'patientNo', width: 15 },
      { header: '患者姓名', key: 'patientName', width: 12 },
      { header: '医院', key: 'hospital', width: 25 },
      { header: 'AE序号', key: 'aeNumber', width: 12 },
      { header: '阶段', key: 'stage', width: 10 },
      { header: '事件名称', key: 'eventName', width: 20 },
      { header: '严重程度', key: 'severity', width: 10 },
      { header: 'SAE', key: 'isSerious', width: 8 },
      { header: '发生时间', key: 'onsetDate', width: 18 },
      { header: '是否持续', key: 'isOngoing', width: 10 },
      { header: '结束时间', key: 'endDate', width: 18 },
      { header: '相关药物', key: 'relatedDrug', width: 15 },
      { header: '因果关系', key: 'causality', width: 12 },
      { header: '结局', key: 'outcome', width: 10 },
      { header: '描述', key: 'description', width: 30 },
    ];

    adverseEvents.forEach((ae) => {
      worksheet.addRow({
        patientNo: ae.patient?.patientNo || '',
        patientName: ae.patient?.user?.name || '',
        hospital: ae.patient?.hospital?.name || '',
        aeNumber: ae.aeNumber || '',
        stage: ae.stage,
        eventName: ae.eventName,
        severity: this.formatSeverity(ae.severity),
        isSerious: ae.isSerious ? '是' : '否',
        onsetDate: this.formatDateTime(ae.onsetDate),
        isOngoing: ae.isOngoing ? '是' : '否',
        endDate: this.formatDateTime(ae.endDate),
        relatedDrug: ae.relatedDrug || '',
        causality: this.formatCausality(ae.causality),
        outcome: this.formatOutcome(ae.outcome),
        description: ae.description || '',
      });
    });

    this.applyStyles(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ==================== 统计报表导出 ====================

  /**
   * 导出 Dashboard 统计数据
   */
  async exportDashboardStats(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: 总体统计
    const statsSheet = workbook.addWorksheet('总体统计');
    statsSheet.columns = [
      { header: '指标', key: 'metric', width: 25 },
      { header: '数值', key: 'value', width: 15 },
    ];

    const totalPatients = await this.patientRepository.count();
    const activePatients = await this.patientRepository.count({ where: { status: 'active' } });
    const completedPatients = await this.patientRepository.count({ where: { status: 'completed' } });
    const withdrawnPatients = await this.patientRepository.count({ where: { status: 'withdrawn' } });
    const totalAE = await this.adverseEventRepository.count();
    const totalSAE = await this.adverseEventRepository.count({ where: { isSerious: true } });
    const totalScaleRecords = await this.scaleRecordRepository.count();
    const totalMedRecords = await this.medicationRecordRepository.count();

    const statsData = [
      { metric: '患者总数', value: totalPatients },
      { metric: '活跃患者', value: activePatients },
      { metric: '已完成患者', value: completedPatients },
      { metric: '退出患者', value: withdrawnPatients },
      { metric: '不良事件总数', value: totalAE },
      { metric: '严重不良事件数', value: totalSAE },
      { metric: '量表记录总数', value: totalScaleRecords },
      { metric: '用药记录总数', value: totalMedRecords },
    ];

    statsData.forEach((data) => statsSheet.addRow(data));
    this.applyStyles(statsSheet);

    // Sheet 2: 阶段分布
    const stageSheet = workbook.addWorksheet('阶段分布');
    stageSheet.columns = [
      { header: '阶段', key: 'stage', width: 15 },
      { header: '患者数', key: 'count', width: 12 },
      { header: '占比', key: 'percentage', width: 12 },
    ];

    const stageDistribution = await this.patientRepository
      .createQueryBuilder('patient')
      .select('patient.currentStage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('patient.currentStage')
      .getRawMany();

    const total = stageDistribution.reduce((sum, item) => sum + parseInt(item.count), 0);

    stageDistribution.forEach((item) => {
      stageSheet.addRow({
        stage: this.formatStage(item.stage),
        count: parseInt(item.count),
        percentage: total > 0 ? `${((parseInt(item.count) / total) * 100).toFixed(1)}%` : '0%',
      });
    });

    this.applyStyles(stageSheet);

    // Sheet 3: 医院统计
    const hospitalSheet = workbook.addWorksheet('医院统计');
    hospitalSheet.columns = [
      { header: '医院', key: 'hospital', width: 30 },
      { header: '患者数', key: 'patientCount', width: 12 },
      { header: '医生数', key: 'doctorCount', width: 12 },
    ];

    const hospitals = await this.hospitalRepository.find({ where: { status: 'active' } });

    for (const hospital of hospitals) {
      const patientCount = await this.patientRepository.count({ where: { hospitalId: hospital.id } });
      const doctorCount = await this.doctorRepository.count({
        where: { hospitalId: hospital.id, auditStatus: 'approved' },
      });

      hospitalSheet.addRow({
        hospital: hospital.name,
        patientCount,
        doctorCount,
      });
    }

    this.applyStyles(hospitalSheet);

    // Sheet 4: 量表统计
    const scaleStatsSheet = workbook.addWorksheet('量表统计');
    scaleStatsSheet.columns = [
      { header: '量表名称', key: 'scaleName', width: 25 },
      { header: '量表代码', key: 'scaleCode', width: 12 },
      { header: '填写次数', key: 'count', width: 12 },
      { header: '平均分', key: 'avgScore', width: 12 },
    ];

    const scaleStats = await this.scaleRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.scale', 'scale')
      .select('scale.name', 'scaleName')
      .addSelect('scale.code', 'scaleCode')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(record.totalScore)', 'avgScore')
      .groupBy('scale.id')
      .addGroupBy('scale.name')
      .addGroupBy('scale.code')
      .getRawMany();

    scaleStats.forEach((stat) => {
      scaleStatsSheet.addRow({
        scaleName: stat.scaleName,
        scaleCode: stat.scaleCode,
        count: parseInt(stat.count),
        avgScore: parseFloat(stat.avgScore).toFixed(1),
      });
    });

    this.applyStyles(scaleStatsSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
