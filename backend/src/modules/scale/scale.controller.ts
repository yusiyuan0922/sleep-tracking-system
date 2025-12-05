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
import { ScaleService } from './scale.service';
import {
  CreateScaleConfigDto,
  UpdateScaleConfigDto,
  SubmitScaleRecordDto,
  QueryScaleRecordDto,
} from './dto/scale.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('量表管理')
@ApiBearerAuth()
@Controller('scales')
export class ScaleController {
  constructor(private readonly scaleService: ScaleService) {}

  // ==================== 量表配置管理接口 ====================

  @Post('configs')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '创建量表配置(仅管理员)' })
  async createConfig(@Body() createScaleConfigDto: CreateScaleConfigDto) {
    return this.scaleService.createConfig(createScaleConfigDto);
  }

  @Get('configs')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取量表配置列表' })
  async findAllConfigs(@Query('status') status?: string) {
    return this.scaleService.findAllConfigs(status);
  }

  @Get('configs/:id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取量表配置详情' })
  async findConfigById(@Param('id', ParseIntPipe) id: number) {
    return this.scaleService.findConfigById(id);
  }

  @Get('configs/code/:code')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据代码获取量表配置' })
  async findConfigByCode(@Param('code') code: string) {
    return this.scaleService.findConfigByCode(code);
  }

  @Put('configs/:id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '更新量表配置(仅管理员)' })
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScaleConfigDto: UpdateScaleConfigDto,
  ) {
    return this.scaleService.updateConfig(id, updateScaleConfigDto);
  }

  @Delete('configs/:id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '删除量表配置(仅管理员)' })
  async removeConfig(@Param('id', ParseIntPipe) id: number) {
    await this.scaleService.removeConfig(id);
    return { message: '删除成功' };
  }

  // ==================== 量表记录管理接口 ====================

  @Post('records')
  @Roles('patient', 'doctor')
  @ApiOperation({ summary: '提交量表记录(患者填写或医生代填)' })
  async submitRecord(@Body() submitScaleRecordDto: SubmitScaleRecordDto) {
    return this.scaleService.submitRecord(submitScaleRecordDto);
  }

  @Get('records')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '查询量表记录列表(支持分页和筛选)' })
  async findAllRecords(@Query() query: QueryScaleRecordDto) {
    return this.scaleService.findAllRecords(query);
  }

  @Get('records/:id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取量表记录详情' })
  async findRecordById(@Param('id', ParseIntPipe) id: number) {
    return this.scaleService.findRecordById(id);
  }

  @Get('patients/:patientId/stages/:stage/records')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者某个阶段的所有量表记录' })
  async getPatientStageRecords(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.scaleService.getPatientStageRecords(patientId, stage);
  }
}
