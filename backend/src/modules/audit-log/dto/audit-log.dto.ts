import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditLogDto {
  @ApiProperty({ description: '阶段记录ID' })
  @IsNumber()
  @Type(() => Number)
  stageRecordId: number;

  @ApiProperty({ description: '审核医生ID' })
  @IsNumber()
  @Type(() => Number)
  auditorId: number;

  @ApiProperty({ description: '审核操作', enum: ['approve', 'reject'] })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiProperty({ description: '审核意见', required: false })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({ description: '审核前状态', required: false })
  @IsString()
  @IsOptional()
  previousStatus?: string;

  @ApiProperty({ description: '审核后状态', required: false })
  @IsString()
  @IsOptional()
  newStatus?: string;
}

export class QueryAuditLogDto {
  @ApiProperty({ description: '阶段记录ID', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  stageRecordId?: number;

  @ApiProperty({ description: '审核医生ID', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  auditorId?: number;

  @ApiProperty({ description: '审核操作', required: false, enum: ['approve', 'reject'] })
  @IsString()
  @IsOptional()
  action?: 'approve' | 'reject';

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
