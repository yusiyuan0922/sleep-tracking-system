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
import { OperationLogService } from './operation-log.service';
import { CreateOperationLogDto, QueryOperationLogDto } from './dto/operation-log.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('操作日志管理')
@ApiBearerAuth()
@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Post()
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '创建操作日志（一般由系统自动调用）' })
  async create(@Body() createOperationLogDto: CreateOperationLogDto) {
    return this.operationLogService.create(createOperationLogDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '查询操作日志列表（支持分页和筛选）' })
  async findAll(@Query() query: QueryOperationLogDto) {
    return this.operationLogService.findAll(query);
  }

  @Get('my-operations')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '查看自己的操作记录' })
  async getMyOperations(
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
  ) {
    return this.operationLogService.findByUser(user.userId, page, pageSize);
  }

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({ summary: '获取操作统计' })
  async getStatistics(
    @Query('userId', ParseIntPipe) userId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.operationLogService.getStatistics(userId, start, end);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '根据ID获取操作日志详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operationLogService.findOne(id);
  }
}
