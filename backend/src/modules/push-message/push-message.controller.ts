import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PushMessageService } from './push-message.service';
import { CreatePushMessageDto, QueryPushMessageDto, MarkAsReadDto } from './dto/push-message.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('推送消息管理')
@ApiBearerAuth()
@Controller('push-messages')
export class PushMessageController {
  constructor(private readonly pushMessageService: PushMessageService) {}

  @Post()
  @Roles('super_admin', 'admin', 'doctor')
  @ApiOperation({ summary: '创建推送消息' })
  async create(@Body() createPushMessageDto: CreatePushMessageDto) {
    return this.pushMessageService.create(createPushMessageDto);
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '查询推送消息列表（支持分页和筛选）' })
  async findAll(@Query() query: QueryPushMessageDto) {
    return this.pushMessageService.findAll(query);
  }

  @Get('my-messages')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取我的消息列表' })
  async getMyMessages(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('isRead') isReadParam?: string,
  ) {
    console.log('[getMyMessages] raw isReadParam:', isReadParam, 'type:', typeof isReadParam);

    // 手动解析 isRead 参数
    let isRead: boolean | undefined;
    if (isReadParam === 'true' || isReadParam === '1') {
      isRead = true;
    } else if (isReadParam === 'false' || isReadParam === '0') {
      isRead = false;
    }

    console.log('[getMyMessages] parsed isRead:', isRead);

    return this.pushMessageService.findByUser(
      user.userId,
      parseInt(page || '1', 10),
      parseInt(pageSize || '10', 10),
      type,
      isRead,
    );
  }

  @Get('unread-count')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取未读消息数量' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.pushMessageService.getUnreadCount(user.userId);
    return { count };
  }

  @Post('mark-as-read')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '标记消息为已读' })
  async markAsRead(@Body() markAsReadDto: MarkAsReadDto) {
    await this.pushMessageService.markAsRead(markAsReadDto.messageIds);
    return { message: '标记成功' };
  }

  @Post('mark-all-as-read')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '标记所有消息为已读' })
  async markAllAsRead(@CurrentUser() user: any) {
    await this.pushMessageService.markAllAsRead(user.userId);
    return { message: '标记成功' };
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '根据ID获取推送消息详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pushMessageService.findOne(id);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '删除推送消息' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.pushMessageService.remove(id);
    return { message: '删除成功' };
  }
}
