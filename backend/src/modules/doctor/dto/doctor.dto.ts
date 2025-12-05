import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// 管理员创建医生DTO
export class CreateDoctorDto {
  @ApiProperty({ description: '医生姓名' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '手机号' })
  @IsString()
  @Length(11, 11)
  phone: string;

  @ApiProperty({ description: '医院ID' })
  @IsInt()
  @Type(() => Number)
  hospitalId: number;

  @ApiPropertyOptional({ description: '工号' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  employeeNo?: string;

  @ApiPropertyOptional({ description: '科室' })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  department?: string;

  @ApiPropertyOptional({ description: '职称' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  title?: string;
}

// 医生注册DTO
export class RegisterDoctorDto {
  @ApiProperty({ description: '用户ID' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '医院ID' })
  @IsInt()
  hospitalId: number;

  @ApiPropertyOptional({ description: '工号' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  employeeNo?: string;

  @ApiPropertyOptional({ description: '科室' })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  department?: string;

  @ApiPropertyOptional({ description: '职称' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  title?: string;

  @ApiPropertyOptional({ description: '资质证明文件URL' })
  @IsString()
  @IsOptional()
  qualificationCertUrl?: string;
}

// 更新医生信息DTO
export class UpdateDoctorDto extends PartialType(RegisterDoctorDto) {
  @ApiPropertyOptional({ description: '医生姓名' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsString()
  @IsOptional()
  @Length(11, 11)
  phone?: string;
}

// 医生审核DTO
export class AuditDoctorDto {
  @ApiProperty({
    description: '审核状态',
    enum: ['approved', 'rejected'],
  })
  @IsEnum(['approved', 'rejected'])
  @IsNotEmpty()
  auditStatus: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '审核备注' })
  @IsString()
  @IsOptional()
  auditRemark?: string;
}

// 查询医生列表DTO
export class QueryDoctorDto {
  @ApiPropertyOptional({ description: '医院ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  hospitalId?: number;

  @ApiPropertyOptional({ description: '审核状态' })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  auditStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ description: '医生姓名(模糊搜索)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number;
}

// 查询我的患者列表DTO(医生端)
export class QueryMyPatientsDto {
  @ApiPropertyOptional({ description: '当前阶段筛选' })
  @IsOptional()
  @IsEnum(['V1', 'V2', 'V3', 'V4', 'completed'])
  currentStage?: string;

  @ApiPropertyOptional({ description: '搜索关键词(患者姓名或编号)' })
  @IsString()
  @IsOptional()
  name?: string;
}
