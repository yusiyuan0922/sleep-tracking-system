import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 通用导出筛选条件 DTO
 */
export class ExportFilterDto {
  @ApiPropertyOptional({ description: '医院ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  hospitalId?: number;

  @ApiPropertyOptional({ description: '医生ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  doctorId?: number;

  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  patientId?: number;

  @ApiPropertyOptional({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4', 'completed'] })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  stage?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'completed', 'withdrawn'] })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: string;

  @ApiPropertyOptional({ description: '开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  endDate?: string;
}

/**
 * 医院维度导出 DTO
 */
export class ExportHospitalDto {
  @ApiPropertyOptional({ description: '医院ID，不传则导出所有医院' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  hospitalId?: number;
}

/**
 * 医生维度导出 DTO
 */
export class ExportDoctorDto {
  @ApiPropertyOptional({ description: '医院ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  hospitalId?: number;

  @ApiPropertyOptional({ description: '医生ID，不传则导出所有医生' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  doctorId?: number;
}

/**
 * 量表记录导出 DTO
 */
export class ExportScaleRecordsDto extends ExportFilterDto {
  @ApiPropertyOptional({ description: '量表代码', enum: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'] })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  scaleCode?: string;
}

/**
 * 不良事件导出 DTO
 */
export class ExportAdverseEventsDto extends ExportFilterDto {
  @ApiPropertyOptional({ description: '严重程度', enum: ['mild', 'moderate', 'severe'] })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  severity?: string;

  @ApiPropertyOptional({ description: '是否严重不良事件' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isSerious?: boolean;
}
