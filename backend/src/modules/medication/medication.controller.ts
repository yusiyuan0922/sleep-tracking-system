import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MedicationService } from './medication.service';
import {
  CreateMedicationRecordDto,
  UpdateMedicationRecordDto,
  QueryMedicationRecordDto,
  CreateConcomitantMedicationDto,
  UpdateConcomitantMedicationDto,
  QueryConcomitantMedicationDto,
} from './dto/medication.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('用药管理')
@ApiBearerAuth()
@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  // ==================== 用药记录管理接口 ====================

  @Post('records')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '创建用药记录（医生或患者填写）' })
  async createMedicationRecord(@Body() createDto: CreateMedicationRecordDto) {
    return this.medicationService.createMedicationRecord(createDto);
  }

  @Get('records')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '查询用药记录列表（支持分页和筛选）' })
  async findAllMedicationRecords(@Query() query: QueryMedicationRecordDto) {
    return this.medicationService.findAllMedicationRecords(query);
  }

  @Get('records/:id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取用药记录详情' })
  async findOneMedicationRecord(@Param('id', ParseIntPipe) id: number) {
    return this.medicationService.findOneMedicationRecord(id);
  }

  @Get('patients/:patientId/stages/:stage/records')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者某个阶段的用药记录' })
  async getPatientStageMedicationRecords(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.medicationService.getPatientStageMedicationRecords(
      patientId,
      stage,
    );
  }

  @Put('records/:id')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '更新用药记录' })
  async updateMedicationRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMedicationRecordDto,
  ) {
    return this.medicationService.updateMedicationRecord(id, updateDto);
  }

  @Delete('records/:id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '删除用药记录' })
  async removeMedicationRecord(@Param('id', ParseIntPipe) id: number) {
    await this.medicationService.removeMedicationRecord(id);
    return { message: '删除成功' };
  }

  // ==================== 合并用药管理接口 ====================

  @Post('concomitant')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '创建合并用药记录（V2/V3/V4阶段）' })
  async createConcomitantMedication(
    @Body() createDto: CreateConcomitantMedicationDto,
  ) {
    return this.medicationService.createConcomitantMedication(createDto);
  }

  @Get('concomitant')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '查询合并用药记录列表（支持分页和筛选）' })
  async findAllConcomitantMedications(
    @Query() query: QueryConcomitantMedicationDto,
  ) {
    return this.medicationService.findAllConcomitantMedications(query);
  }

  @Get('concomitant/:id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取合并用药记录详情' })
  async findOneConcomitantMedication(@Param('id', ParseIntPipe) id: number) {
    return this.medicationService.findOneConcomitantMedication(id);
  }

  @Get('patients/:patientId/stages/:stage/concomitant')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者某个阶段的合并用药记录' })
  async getPatientStageConcomitantMedications(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.medicationService.getPatientStageConcomitantMedications(
      patientId,
      stage,
    );
  }

  @Put('concomitant/:id')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '更新合并用药记录' })
  async updateConcomitantMedication(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConcomitantMedicationDto,
  ) {
    return this.medicationService.updateConcomitantMedication(id, updateDto);
  }

  @Delete('concomitant/:id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '删除合并用药记录' })
  async removeConcomitantMedication(@Param('id', ParseIntPipe) id: number) {
    await this.medicationService.removeConcomitantMedication(id);
    return { message: '删除成功' };
  }
}
