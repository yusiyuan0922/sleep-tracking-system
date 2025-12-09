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
import { MedicalFileService } from './medical-file.service';
import {
  CreateMedicalFileDto,
  UpdateMedicalFileDto,
  QueryMedicalFileDto,
} from './dto/medical-file.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('病历文件管理')
@ApiBearerAuth()
@Controller('medical-files')
export class MedicalFileController {
  constructor(private readonly medicalFileService: MedicalFileService) {}

  @Post()
  @Roles('doctor')
  @ApiOperation({ summary: '上传病历文件（仅医生可操作）' })
  async createMedicalFile(@Body() createDto: CreateMedicalFileDto) {
    return this.medicalFileService.createMedicalFile(createDto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '查询病历文件列表（支持分页和筛选）' })
  async findAllMedicalFiles(@Query() query: QueryMedicalFileDto) {
    return this.medicalFileService.findAllMedicalFiles(query);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取病历文件详情' })
  async findOneMedicalFile(@Param('id', ParseIntPipe) id: number) {
    return this.medicalFileService.findOneMedicalFile(id);
  }

  @Get('patients/:patientId/stages/:stage')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者某个阶段的病历文件' })
  async getPatientStageMedicalFiles(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.medicalFileService.getPatientStageMedicalFiles(
      patientId,
      stage,
    );
  }

  @Put(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '更新病历文件信息' })
  async updateMedicalFile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMedicalFileDto,
  ) {
    return this.medicalFileService.updateMedicalFile(id, updateDto);
  }

  @Delete(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '删除病历文件' })
  async removeMedicalFile(@Param('id', ParseIntPipe) id: number) {
    await this.medicalFileService.removeMedicalFile(id);
    return { message: '删除成功' };
  }
}
