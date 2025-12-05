import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsDateString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

// 患者注册DTO
export class RegisterPatientDto {
  @ApiProperty({ description: '患者姓名' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '性别', enum: ['male', 'female'] })
  @IsEnum(['male', 'female'])
  @IsNotEmpty()
  gender: 'male' | 'female';

  @ApiProperty({ description: '出生日期', example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({ description: '联系电话' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  phone: string;

  @ApiPropertyOptional({ description: '紧急联系人' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  emergencyContact?: string;

  @ApiPropertyOptional({ description: '紧急联系电话' })
  @IsString()
  @IsOptional()
  @Length(0, 11)
  emergencyPhone?: string;

  @ApiProperty({ description: '主治医生ID' })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  doctorId: number;

  @ApiProperty({ description: '医院ID' })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  hospitalId: number;

  @ApiPropertyOptional({ description: '诊断信息' })
  @IsString()
  @IsOptional()
  diagnosis?: string;
}

// 查询患者列表DTO
export class QueryPatientDto {
  @ApiPropertyOptional({ description: '医生ID(医生查看自己的患者)' })
  @IsOptional()
  @IsInt()
  doctorId?: number;

  @ApiPropertyOptional({ description: '医院ID' })
  @IsOptional()
  @IsInt()
  hospitalId?: number;

  @ApiPropertyOptional({ description: '当前阶段' })
  @IsOptional()
  @IsEnum(['V1', 'V2', 'V3', 'V4', 'completed'])
  currentStage?: 'V1' | 'V2' | 'V3' | 'V4' | 'completed';

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsEnum(['active', 'completed', 'withdrawn'])
  status?: 'active' | 'completed' | 'withdrawn';

  @ApiPropertyOptional({ description: '患者姓名(模糊搜索)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '患者编号' })
  @IsString()
  @IsOptional()
  patientNo?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  pageSize?: number;
}

// 更新患者状态DTO
export class UpdatePatientStatusDto {
  @ApiProperty({
    description: '状态',
    enum: ['active', 'completed', 'withdrawn'],
  })
  @IsEnum(['active', 'completed', 'withdrawn'])
  @IsNotEmpty()
  status: 'active' | 'completed' | 'withdrawn';
}

// 完成V1阶段DTO
export class CompleteV1Dto {
  @ApiProperty({ description: 'V2窗口开始日期', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  v2WindowStart: string;

  @ApiProperty({ description: 'V2窗口结束日期', example: '2024-01-25' })
  @IsDateString()
  @IsNotEmpty()
  v2WindowEnd: string;
}

// 完成V2阶段DTO
export class CompleteV2Dto {
  @ApiProperty({ description: 'V3窗口开始日期', example: '2024-02-15' })
  @IsDateString()
  @IsNotEmpty()
  v3WindowStart: string;

  @ApiProperty({ description: 'V3窗口结束日期', example: '2024-02-25' })
  @IsDateString()
  @IsNotEmpty()
  v3WindowEnd: string;
}

// 完成V3阶段DTO
export class CompleteV3Dto {
  @ApiProperty({ description: 'V4窗口开始日期', example: '2024-03-15' })
  @IsDateString()
  @IsNotEmpty()
  v4WindowStart: string;

  @ApiProperty({ description: 'V4窗口结束日期', example: '2024-03-25' })
  @IsDateString()
  @IsNotEmpty()
  v4WindowEnd: string;
}
