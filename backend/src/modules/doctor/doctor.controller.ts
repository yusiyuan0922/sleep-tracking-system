import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import {
  RegisterDoctorDto,
  UpdateDoctorDto,
  AuditDoctorDto,
  QueryDoctorDto,
} from './dto/doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('医生管理')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

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

  @Get('my-info')
  @Roles('doctor')
  @ApiOperation({ summary: '获取当前登录医生的信息' })
  async getMyInfo(@CurrentUser() user: any) {
    const doctor = await this.doctorService.findByUserId(user.userId);
    if (!doctor) {
      return { message: '您还未注册为医生' };
    }
    return doctor;
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取医生详情(by ID)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findOne(id);
  }

  @Patch(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '更新医生信息' })
  async update(
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
