import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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
  @IsOptional()
  @Transform(({ value }) => {
    console.log('[Transform isRead] input value:', value, 'type:', typeof value);
    if (value === '' || value === null || value === undefined) return undefined;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
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
