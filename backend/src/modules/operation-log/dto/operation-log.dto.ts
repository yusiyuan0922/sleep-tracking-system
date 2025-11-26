import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOperationLogDto {
  @ApiProperty({ description: '操作用户ID' })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '操作模块', example: 'patient' })
  @IsString()
  module: string;

  @ApiProperty({ description: '操作类型', example: 'create' })
  @IsString()
  action: string;

  @ApiProperty({ description: '操作描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '操作详情', required: false })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @ApiProperty({ description: 'IP地址', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ description: '用户代理', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: '是否成功', default: true })
  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @ApiProperty({ description: '错误信息', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}

export class QueryOperationLogDto {
  @ApiProperty({ description: '用户ID', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: '操作模块', required: false })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({ description: '操作类型', required: false })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({ description: '是否成功', required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  success?: boolean;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}
