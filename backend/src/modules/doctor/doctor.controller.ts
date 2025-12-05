import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import {
  CreateDoctorDto,
  RegisterDoctorDto,
  UpdateDoctorDto,
  AuditDoctorDto,
  QueryDoctorDto,
  QueryMyPatientsDto,
} from './dto/doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('医生管理')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '创建医生(管理员创建,会同时创建User和Doctor记录)' })
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }

  @Post('register')
  @Roles('doctor')
  @ApiOperation({ summary: '医生注册(医生角色用户申请成为医生)' })
  async register(@Body() registerDoctorDto: RegisterDoctorDto) {
    return this.doctorService.register(registerDoctorDto);
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取医生列表(支持分页和筛选,管理员可查看所有医生)' })
  async findAll(@Query() query: QueryDoctorDto) {
    return this.doctorService.findAll(query);
  }

  @Get('me')
  @Roles('doctor')
  @ApiOperation({ summary: '获取当前登录医生的信息' })
  async getMyInfo(@CurrentUser() user: any) {
    const doctor = await this.doctorService.findByUserId(user.userId);
    if (!doctor) {
      return { message: '您还未注册为医生' };
    }
    return doctor;
  }

  @Get('my-patients')
  @Roles('doctor', 'super_admin')
  @ApiOperation({ summary: '获取我的患者列表' })
  async getMyPatients(
    @CurrentUser() user: any,
    @Query() query: QueryMyPatientsDto,
  ) {
    return this.doctorService.getMyPatients(user.userId, query);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取医生详情(by ID)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'doctor', 'admin')
  @ApiOperation({ summary: '更新医生信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorService.update(id, updateDoctorDto);
  }

  @Patch(':id')
  @Roles('super_admin', 'doctor', 'admin')
  @ApiOperation({ summary: '更新医生信息(PATCH)' })
  async partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorService.update(id, updateDoctorDto);
  }

  @Post(':id/audit')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '审核医生注册(管理员审核)' })
  async audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() auditDoctorDto: AuditDoctorDto,
    @CurrentUser() user: any,
  ) {
    return this.doctorService.audit(id, auditDoctorDto, user.userId);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '删除医生(软删除,修改审核状态为rejected)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.remove(id);
  }
}
