import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePushMessageDto {
  @ApiProperty({ description: '接收用户ID' })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({
    description: '消息类型',
    enum: ['stage_reminder', 'audit_result', 'ae_alert', 'system_notice']
  })
  @IsString()
  @IsIn(['stage_reminder', 'audit_result', 'ae_alert', 'system_notice'])
  type: 'stage_reminder' | 'audit_result' | 'ae_alert' | 'system_notice';

  @ApiProperty({ description: '消息标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '扩展数据', required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class QueryPushMessageDto {
  @ApiProperty({ description: '用户ID', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: '消息类型', required: false })
  @IsString()
  @IsOptional()
  type?: 'stage_reminder' | 'audit_result' | 'ae_alert' | 'system_notice';

  @ApiProperty({ description: '是否已读', required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class MarkAsReadDto {
  @ApiProperty({ description: '消息ID列表' })
  @IsNumber({}, { each: true })
  @Type(() => Number)
  messageIds: number[];
}
