import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  UpdateHospitalStatusDto,
  QueryHospitalDto,
} from './dto/hospital.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('医院管理')
@ApiBearerAuth()
@Controller('hospitals')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '创建医院' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createHospitalDto: CreateHospitalDto) {
    return await this.hospitalService.create(createHospitalDto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取医院列表(支持分页和筛选)' })
  async findAll(@Query() query: QueryHospitalDto) {
    return await this.hospitalService.findAll(query);
  }

  @Get('active')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取所有激活状态的医院(用于下拉选择)' })
  async findAllActive() {
    return await this.hospitalService.findAllActive();
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '获取医院详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.hospitalService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '更新医院信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ) {
    return await this.hospitalService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '删除医院(软删除,修改为inactive状态)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.hospitalService.remove(id);
    return { message: '删除成功' };
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '更新医院状态' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateHospitalStatusDto,
  ) {
    return await this.hospitalService.updateStatus(id, updateStatusDto);
  }
}
