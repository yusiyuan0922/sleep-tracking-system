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
import { SystemConfigService } from './system-config.service';
import { CreateSystemConfigDto, UpdateSystemConfigDto, QuerySystemConfigDto } from './dto/system-config.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('系统配置管理')
@ApiBearerAuth()
@Controller('system-configs')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建系统配置' })
  async create(@Body() createSystemConfigDto: CreateSystemConfigDto) {
    return this.systemConfigService.create(createSystemConfigDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '查询系统配置列表' })
  async findAll(@Query() query: QuerySystemConfigDto) {
    return this.systemConfigService.findAll(query);
  }

  @Get('categories')
  @Roles('admin')
  @ApiOperation({ summary: '获取所有配置分组' })
  async getCategories() {
    const categories = await this.systemConfigService.getCategories();
    return { categories };
  }

  @Get('key/:configKey')
  @Roles('admin')
  @ApiOperation({ summary: '根据配置键获取配置' })
  async findByKey(@Param('configKey') configKey: string) {
    return this.systemConfigService.findByKey(configKey);
  }

  @Get('value/:configKey')
  @Roles('admin')
  @ApiOperation({ summary: '获取配置值（带类型转换）' })
  async getValue(@Param('configKey') configKey: string) {
    const value = await this.systemConfigService.getValue(configKey);
    return { value };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '根据ID获取系统配置详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新系统配置' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSystemConfigDto: UpdateSystemConfigDto,
  ) {
    return this.systemConfigService.update(id, updateSystemConfigDto);
  }

  @Put('key/:configKey')
  @Roles('admin')
  @ApiOperation({ summary: '根据配置键更新配置值' })
  async updateByKey(
    @Param('configKey') configKey: string,
    @Body('configValue') configValue: string,
  ) {
    return this.systemConfigService.updateByKey(configKey, configValue);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除系统配置' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.systemConfigService.remove(id);
    return { message: '删除成功' };
  }
}
