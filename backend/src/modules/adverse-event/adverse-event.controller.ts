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
import { AdverseEventService } from './adverse-event.service';
import {
  CreateAdverseEventDto,
  UpdateAdverseEventDto,
  QueryAdverseEventDto,
  CreateAeAttachmentDto,
} from './dto/adverse-event.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('不良事件管理')
@ApiBearerAuth()
@Controller('adverse-events')
export class AdverseEventController {
  constructor(private readonly adverseEventService: AdverseEventService) {}

  // ==================== 不良事件管理接口 ====================

  @Post()
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '创建不良事件记录（医生或患者填写）' })
  async createAdverseEvent(@Body() createDto: CreateAdverseEventDto) {
    return this.adverseEventService.createAdverseEvent(createDto);
  }

  @Get()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: '查询不良事件列表（支持分页和筛选）' })
  async findAllAdverseEvents(@Query() query: QueryAdverseEventDto) {
    return this.adverseEventService.findAllAdverseEvents(query);
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取不良事件详情' })
  async findOneAdverseEvent(@Param('id', ParseIntPipe) id: number) {
    return this.adverseEventService.findOneAdverseEvent(id);
  }

  @Get('patients/:patientId/stages/:stage')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取患者某个阶段的不良事件' })
  async getPatientStageAdverseEvents(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('stage') stage: string,
  ) {
    return this.adverseEventService.getPatientStageAdverseEvents(
      patientId,
      stage,
    );
  }

  @Put(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '更新不良事件' })
  async updateAdverseEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdverseEventDto,
  ) {
    return this.adverseEventService.updateAdverseEvent(id, updateDto);
  }

  @Delete(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '删除不良事件' })
  async removeAdverseEvent(@Param('id', ParseIntPipe) id: number) {
    await this.adverseEventService.removeAdverseEvent(id);
    return { message: '删除成功' };
  }

  // ==================== 不良事件附件管理接口 ====================

  @Post('attachments')
  @Roles('doctor', 'patient')
  @ApiOperation({ summary: '为不良事件添加附件' })
  async createAttachment(@Body() createDto: CreateAeAttachmentDto) {
    return this.adverseEventService.createAttachment(createDto);
  }

  @Get(':aeId/attachments')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取不良事件的所有附件' })
  async getEventAttachments(@Param('aeId', ParseIntPipe) aeId: number) {
    return this.adverseEventService.getEventAttachments(aeId);
  }

  @Delete('attachments/:id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: '删除附件' })
  async removeAttachment(@Param('id', ParseIntPipe) id: number) {
    await this.adverseEventService.removeAttachment(id);
    return { message: '删除成功' };
  }
}
