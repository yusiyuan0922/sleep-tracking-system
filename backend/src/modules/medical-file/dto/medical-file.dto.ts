import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

// 创建病历文件 DTO
export class CreateMedicalFileDto {
  @ApiProperty({ description: '患者ID' })
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiProperty({
    description: '文件类别',
    enum: ['informed_consent', 'medical_record', 'lab_report', 'other'],
  })
  @IsEnum(['informed_consent', 'medical_record', 'lab_report', 'other'])
  @IsNotEmpty()
  fileCategory: 'informed_consent' | 'medical_record' | 'lab_report' | 'other';

  @ApiPropertyOptional({ description: '文件描述' })
  @IsString()
  @IsOptional()
  description?: string;

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

// 更新病历文件 DTO
export class UpdateMedicalFileDto extends PartialType(CreateMedicalFileDto) {}

// 查询病历文件 DTO
export class QueryMedicalFileDto {
  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: '阶段', enum: ['V1', 'V2', 'V3', 'V4'] })
  @IsOptional()
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  stage?: 'V1' | 'V2' | 'V3' | 'V4';

  @ApiPropertyOptional({
    description: '文件类别',
    enum: ['informed_consent', 'medical_record', 'lab_report', 'other'],
  })
  @IsOptional()
  @IsEnum(['informed_consent', 'medical_record', 'lab_report', 'other'])
  fileCategory?: 'informed_consent' | 'medical_record' | 'lab_report' | 'other';

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
