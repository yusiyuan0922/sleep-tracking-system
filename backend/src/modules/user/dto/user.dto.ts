import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';

// 更新用户基本信息DTO
export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: '姓名', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '性别', enum: ['male', 'female'] })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ description: '出生日期', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: '手机号', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @MinLength(11)
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarUrl?: string;
}

// 更新用户状态DTO (仅管理员)
export class UpdateUserStatusDto {
  @ApiProperty({
    description: '状态',
    enum: ['active', 'inactive', 'deleted'],
  })
  @IsEnum(['active', 'inactive', 'deleted'])
  status: 'active' | 'inactive' | 'deleted';
}
