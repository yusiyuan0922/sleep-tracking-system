import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto/audit-log.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('审计日志管理')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '创建审计日志（一般由系统自动调用）' })
  async create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogService.create(createAuditLogDto);
  }

  @Get()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: '查询审计日志列表（支持分页和筛选）' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }

  @Get('my-audits')
  @Roles('doctor')
  @ApiOperation({ summary: '医生查看自己的审计记录' })
  async getMyAudits(
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
  ) {
    // 这里需要通过user.userId查找对应的doctorId
    // 简化处理，假设前端传递doctorId或从token中获取
    const doctorId = user.doctorId; // 需要在JWT token中包含doctorId
    return this.auditLogService.findByAuditor(doctorId, page, pageSize);
  }

  @Get('stage-record/:stageRecordId')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取阶段记录的所有审计日志' })
  async findByStageRecord(
    @Param('stageRecordId', ParseIntPipe) stageRecordId: number,
  ) {
    return this.auditLogService.findByStageRecord(stageRecordId);
  }

  @Get(':id')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: '根据ID获取审计日志详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditLogService.findOne(id);
  }
}
