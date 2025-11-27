import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StageRecordService } from './stage-record.service';
import {
  CreateStageRecordDto,
  SubmitStageRecordDto,
  AuditStageRecordDto,
  QueryStageRecordDto,
} from './dto/stage-record.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('阶段记录管理')
@ApiBearerAuth()
@Controller('stage-records')
export class StageRecordController {
  constructor(private readonly stageRecordService: StageRecordService) {}

  @Post()
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '创建阶段记录（草稿状态）' })
  async createStageRecord(@Body() createDto: CreateStageRecordDto) {
    return this.stageRecordService.createStageRecord(createDto);
  }

  @Post(':id/submit')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '提交阶段记录' })
  async submitStageRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() submitDto: SubmitStageRecordDto,
  ) {
    return this.stageRecordService.submitStageRecord(id, submitDto);
  }

  @Post(':id/audit')
  @Roles('doctor')
  @ApiOperation({ summary: '审核阶段记录（医生审核）' })
  async auditStageRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() auditDto: AuditStageRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.stageRecordService.auditStageRecord(
      id,
      auditDto,
      user.userId,
    );
  }

  @Get()
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '查询阶段记录列表（支持分页和筛选）' })
  async findAllStageRecords(@Query() query: QueryStageRecordDto) {
    return this.stageRecordService.findAllStageRecords(query);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取阶段记录详情' })
  async findOneStageRecord(@Param('id', ParseIntPipe) id: number) {
    return this.stageRecordService.findOneStageRecord(id);
  }

  @Get('patients/:patientId/stages/:stage')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者的阶段记录' })
  async getPatientStageRecord(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.stageRecordService.getPatientStageRecord(patientId, stage);
  }

  @Delete(':id')
  @Roles('super_admin', 'doctor', 'admin')
  @ApiOperation({ summary: '删除阶段记录（仅草稿状态）' })
  async removeStageRecord(@Param('id', ParseIntPipe) id: number) {
    await this.stageRecordService.removeStageRecord(id);
    return { message: '删除成功' };
  }
}
