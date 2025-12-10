import { Controller, Post, Body, Param, Res, ParseIntPipe } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExportService } from './export.service';
import {
  ExportFilterDto,
  ExportHospitalDto,
  ExportDoctorDto,
  ExportScaleRecordsDto,
  ExportAdverseEventsDto,
} from './dto/export.dto';

@Controller('export')
@ApiTags('数据导出')
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 设置 Excel 文件响应头
   */
  private setExcelHeaders(res: Response, filename: string) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
  }

  // ==================== 医院维度导出 ====================

  @Post('hospital-summary')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出医院患者汇总' })
  async exportHospitalSummary(
    @Body() dto: ExportHospitalDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportHospitalSummary(dto);
    const filename = `医院患者汇总_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  // ==================== 医生维度导出 ====================

  @Post('doctor-summary')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出医生工作量统计' })
  async exportDoctorSummary(
    @Body() dto: ExportDoctorDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportDoctorSummary(dto);
    const filename = `医生工作量统计_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  // ==================== 患者维度导出 ====================

  @Post('patients')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出患者列表' })
  async exportPatients(
    @Body() dto: ExportFilterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPatientsList(dto);
    const filename = `患者列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  @Post('patient-profile/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出单患者完整档案' })
  async exportPatientProfile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPatientProfile(id);
    const filename = `患者档案_${id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  @Post('scale-records')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出量表记录' })
  async exportScaleRecords(
    @Body() dto: ExportScaleRecordsDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportScaleRecords(dto);
    const filename = `量表记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  @Post('medication-records')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出用药记录' })
  async exportMedicationRecords(
    @Body() dto: ExportFilterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportMedicationRecords(dto);
    const filename = `用药记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  @Post('adverse-events')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出不良事件' })
  async exportAdverseEvents(
    @Body() dto: ExportAdverseEventsDto,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportAdverseEvents(dto);
    const filename = `不良事件_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }

  // ==================== 统计报表导出 ====================

  @Post('dashboard-stats')
  @Roles('super_admin')
  @ApiOperation({ summary: '导出Dashboard统计数据' })
  async exportDashboardStats(@Res() res: Response) {
    const buffer = await this.exportService.exportDashboardStats();
    const filename = `统计报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    this.setExcelHeaders(res, filename);
    res.send(buffer);
  }
}
