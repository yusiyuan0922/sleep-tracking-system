import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

// 创建用药记录 DTO
export class CreateMedicationRecordDto {
  @ApiProperty({ description: '患者ID' })
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiProperty({ description: '药品名称' })
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiProperty({ description: '规格，如10mg/片' })
  @IsString()
  @IsNotEmpty()
  specification: string;

  @ApiProperty({ description: '每次剂量' })
  @IsNumber()
  @IsNotEmpty()
  dosage: number;

  @ApiProperty({ description: '剂量单位，如mg/片/粒' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: '用药频率，如每日1次' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ description: '用药途径，如口服/注射' })
  @IsString()
  @IsNotEmpty()
  route: string;

  @ApiProperty({ description: '开始日期，格式：YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ description: '结束日期，格式：YYYY-MM-DD' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

// 更新用药记录 DTO
export class UpdateMedicationRecordDto extends PartialType(
  CreateMedicationRecordDto,
) {}

// 查询用药记录 DTO
export class QueryMedicationRecordDto {
  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsOptional()
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  stage?: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiPropertyOptional({ description: '药品名称（模糊查询）' })
  @IsOptional()
  @IsString()
  drugName?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

// 创建合并用药 DTO
export class CreateConcomitantMedicationDto {
  @ApiProperty({ description: '患者ID' })
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '阶段（V1不需要合并用药）', enum: ['V2', 'V3', 'V4'] })
  @IsEnum(['V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: 'V2' | 'V3' | 'V4';

  @ApiProperty({ description: '药品名称' })
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiProperty({ description: '规格' })
  @IsString()
  @IsNotEmpty()
  specification: string;

  @ApiProperty({ description: '每次剂量' })
  @IsNumber()
  @IsNotEmpty()
  dosage: number;

  @ApiProperty({ description: '剂量单位' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: '用药频率' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ description: '用药途径' })
  @IsString()
  @IsNotEmpty()
  route: string;

  @ApiProperty({ description: '开始日期，格式：YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ description: '结束日期，格式：YYYY-MM-DD' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '用药原因/适应症' })
  @IsString()
  @IsNotEmpty()
  indication: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

// 更新合并用药 DTO
export class UpdateConcomitantMedicationDto extends PartialType(
  CreateConcomitantMedicationDto,
) {}

// 查询合并用药 DTO
export class QueryConcomitantMedicationDto {
  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: '阶段', enum: ['V2', 'V3', 'V4'] })
  @IsOptional()
  @IsEnum(['V2', 'V3', 'V4'])
  stage?: 'V2' | 'V3' | 'V4';

  @ApiPropertyOptional({ description: '药品名称（模糊查询）' })
  @IsOptional()
  @IsString()
  drugName?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
