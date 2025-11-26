import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

// 患者注册DTO
export class RegisterPatientDto {
  @ApiProperty({ description: '用户ID' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '主治医生ID' })
  @IsInt()
  @IsNotEmpty()
  doctorId: number;

  @ApiProperty({ description: '医院ID' })
  @IsInt()
  @IsNotEmpty()
  hospitalId: number;
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
