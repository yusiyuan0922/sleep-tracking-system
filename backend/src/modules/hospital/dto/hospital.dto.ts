import { IsString, IsOptional, Length, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty({ description: '医院名称' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ description: '省份' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  province?: string;

  @ApiPropertyOptional({ description: '城市' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  city?: string;

  @ApiPropertyOptional({ description: '详细地址' })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  address?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  contactPhone?: string;
}

export class UpdateHospitalDto {
  @ApiPropertyOptional({ description: '医院名称' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({ description: '省份' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  province?: string;

  @ApiPropertyOptional({ description: '城市' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  city?: string;

  @ApiPropertyOptional({ description: '详细地址' })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  address?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  contactPhone?: string;
}

export class UpdateHospitalStatusDto {
  @ApiProperty({ description: '状态:active/inactive', enum: ['active', 'inactive'] })
  @IsString()
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

export class QueryHospitalDto {
  @ApiPropertyOptional({ description: '医院名称(模糊搜索)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '省份' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ description: '城市' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive'] })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  pageSize?: number;
}
