import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// 创建不良事件 DTO
export class CreateAdverseEventDto {
  @ApiProperty({ description: '患者ID' })
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiProperty({ description: '不良事件名称' })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiProperty({ description: '严重程度', enum: ['mild', 'moderate', 'severe'] })
  @IsEnum(['mild', 'moderate', 'severe'])
  @IsNotEmpty()
  severity: 'mild' | 'moderate' | 'severe';

  @ApiProperty({ description: '是否严重不良事件(SAE)', default: false })
  @IsBoolean()
  @IsNotEmpty()
  isSerious: boolean;

  @ApiProperty({ description: '发生时间，格式：YYYY-MM-DD HH:mm:ss' })
  @IsDateString()
  @IsNotEmpty()
  onsetDate: string;

  @ApiProperty({ description: '是否持续中', default: false })
  @IsBoolean()
  @IsNotEmpty()
  isOngoing: boolean;

  @ApiPropertyOptional({ description: '结束时间，格式：YYYY-MM-DD HH:mm:ss' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '详细描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '可能相关药物' })
  @IsString()
  @IsOptional()
  relatedDrug?: string;

  @ApiPropertyOptional({
    description: '因果关系',
    enum: ['definite', 'probable', 'possible', 'unlikely', 'unrelated'],
  })
  @IsEnum(['definite', 'probable', 'possible', 'unlikely', 'unrelated'])
  @IsOptional()
  causality?: 'definite' | 'probable' | 'possible' | 'unlikely' | 'unrelated';

  @ApiPropertyOptional({
    description: '采取措施',
    enum: ['none', 'dose_reduced', 'drug_stopped', 'treatment_given'],
  })
  @IsEnum(['none', 'dose_reduced', 'drug_stopped', 'treatment_given'])
  @IsOptional()
  action?: 'none' | 'dose_reduced' | 'drug_stopped' | 'treatment_given';

  @ApiPropertyOptional({
    description: '结果',
    enum: ['recovered', 'recovering', 'not_recovered', 'fatal', 'unknown'],
  })
  @IsEnum(['recovered', 'recovering', 'not_recovered', 'fatal', 'unknown'])
  @IsOptional()
  outcome?: 'recovered' | 'recovering' | 'not_recovered' | 'fatal' | 'unknown';

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

// 更新不良事件 DTO
export class UpdateAdverseEventDto extends PartialType(CreateAdverseEventDto) {}

// 查询不良事件 DTO
export class QueryAdverseEventDto {
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

  @ApiPropertyOptional({ description: '严重程度', enum: ['mild', 'moderate', 'severe'] })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['mild', 'moderate', 'severe'])
  severity?: 'mild' | 'moderate' | 'severe';

  @ApiPropertyOptional({ description: '是否严重不良事件' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Boolean)
  @IsBoolean()
  isSerious?: boolean;

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

// 创建不良事件附件 DTO
export class CreateAeAttachmentDto {
  @ApiProperty({ description: '不良事件ID' })
  @IsNumber()
  @IsNotEmpty()
  aeId: number;

  @ApiProperty({ description: '文件类型，如image/pdf/doc' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ description: '原始文件名' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'OSS文件URL' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: '文件大小(字节)' })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;
}
