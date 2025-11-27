import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// 创建阶段记录 DTO
export class CreateStageRecordDto {
  @ApiProperty({ description: '患者ID' })
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: 'V1' | 'V2' | 'V3' | 'V4';
}

// 提交阶段记录 DTO
export class SubmitStageRecordDto {
  @ApiProperty({ description: '提交时间，格式：YYYY-MM-DD HH:mm:ss' })
  @IsDateString()
  @IsNotEmpty()
  submittedAt: string;
}

// 审核阶段记录 DTO
export class AuditStageRecordDto {
  @ApiProperty({ description: '审核结果', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  @IsNotEmpty()
  auditResult: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '审核意见' })
  @IsString()
  @IsOptional()
  auditRemark?: string;

  @ApiPropertyOptional({ description: '驳回原因（审核结果为rejected时必填）' })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}

// 查询阶段记录 DTO
export class QueryStageRecordDto {
  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  stage?: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiPropertyOptional({
    description: '状态',
    enum: ['draft', 'submitted', 'approved', 'rejected'],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['draft', 'submitted', 'approved', 'rejected'])
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Transform(({ value }) => (value === '' ? 1 : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @Transform(({ value }) => (value === '' ? 10 : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 10;
}
