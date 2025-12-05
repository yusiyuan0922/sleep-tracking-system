import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import {
  RegisterPatientDto,
  QueryPatientDto,
  UpdatePatientStatusDto,
  CompleteV1Dto,
  CompleteV2Dto,
  CompleteV3Dto,
} from './dto/patient.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('患者管理')
@ApiBearerAuth()
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @Roles('patient')
  @ApiOperation({ summary: '患者注册(患者填写基本信息并选择医生)' })
  async register(
    @Body() registerPatientDto: RegisterPatientDto,
    @CurrentUser() user: any,
  ) {
    return this.patientService.register(registerPatientDto, user.userId);
  }

  @Get()
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取患者列表(支持分页和筛选)' })
  async findAll(@Query() query: QueryPatientDto) {
    return this.patientService.findAll(query);
  }

  @Get('my-patients')
  @Roles('doctor')
  @ApiOperation({ summary: '医生查看自己的患者列表' })
  async getMyPatients(
    @CurrentUser() user: any,
    @Query() query: QueryPatientDto,
  ) {
    // 从CurrentUser获取医生的userId,然后查找对应的doctorId
    // 这里简化处理,假设前端会传递doctorId
    return this.patientService.findAll(query);
  }

  @Get('me')
  @Roles('patient')
  @ApiOperation({ summary: '患者查看自己的信息' })
  async getMyInfo(@CurrentUser() user: any) {
    const patient = await this.patientService.findByUserId(user.userId);
    if (!patient) {
      return { message: '您还未注册为患者' };
    }
    return patient;
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者详情(by ID)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.findOne(id);
  }

  @Get(':id/time-windows')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者的时间窗口信息' })
  async getTimeWindows(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.getTimeWindows(id);
  }

  @Get(':id/stage-completion-status')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者当前阶段的完成状态' })
  async getStageCompletionStatus(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.getStageCompletionStatus(id);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '更新患者状态' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientStatusDto: UpdatePatientStatusDto,
  ) {
    return this.patientService.updateStatus(id, updatePatientStatusDto);
  }

  @Post(':id/complete-v1')
  @Roles('doctor')
  @ApiOperation({ summary: '完成V1阶段,设置V2时间窗口' })
  async completeV1(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeV1Dto: CompleteV1Dto,
  ) {
    return this.patientService.completeV1(id, completeV1Dto);
  }

  @Post(':id/complete-v2')
  @Roles('doctor')
  @ApiOperation({ summary: '完成V2阶段,设置V3时间窗口' })
  async completeV2(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeV2Dto: CompleteV2Dto,
  ) {
    return this.patientService.completeV2(id, completeV2Dto);
  }

  @Post(':id/complete-v3')
  @Roles('doctor')
  @ApiOperation({ summary: '完成V3阶段,设置V4时间窗口' })
  async completeV3(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeV3Dto: CompleteV3Dto,
  ) {
    return this.patientService.completeV3(id, completeV3Dto);
  }

  @Post(':id/complete-v4')
  @Roles('doctor')
  @ApiOperation({ summary: '完成V4阶段(完成整个治疗流程)' })
  async completeV4(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.completeV4(id);
  }
}
