import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateSystemConfigDto {
  @ApiProperty({ description: '配置键', example: 'wechat_app_id' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '配置名称', required: false })
  @IsString()
  @IsOptional()
  configName?: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  configValue: string;

  @ApiProperty({
    description: '值类型',
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
  })
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json'])
  @IsOptional()
  valueType?: 'string' | 'number' | 'boolean' | 'json';

  @ApiProperty({ description: '配置说明', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '配置分组', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: '是否可编辑', default: true })
  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ description: '配置名称', required: false })
  @IsString()
  @IsOptional()
  configName?: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  @IsOptional()
  configValue?: string;

  @ApiProperty({ description: '配置说明', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '配置分组', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}

export class QuerySystemConfigDto {
  @ApiProperty({ description: '配置分组', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: '配置键（模糊搜索）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;
}
