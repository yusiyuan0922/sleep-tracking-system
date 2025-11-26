import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';

// 创建/更新量表配置DTO
export class CreateScaleConfigDto {
  @ApiProperty({
    description: '量表代码',
    enum: ['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'],
    example: 'AIS',
  })
  @IsEnum(['AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD'])
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '量表名称', example: '失眠严重程度指数量表' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '量表类型',
    enum: ['self', 'doctor'],
    example: 'self',
  })
  @IsEnum(['self', 'doctor'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: '题目总数', example: 7 })
  @IsInt()
  @IsNotEmpty()
  totalItems: number;

  @ApiProperty({ description: '最高分数', example: 28 })
  @IsInt()
  @IsNotEmpty()
  maxScore: number;

  @ApiProperty({
    description: '题目配置(JSON格式)',
    example: [
      {
        question: '请评估您入睡的困难程度',
        options: [
          { label: '无', value: 0 },
          { label: '轻度', value: 1 },
          { label: '中度', value: 2 },
          { label: '重度', value: 3 },
          { label: '极重度', value: 4 },
        ],
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  questions: any;

  @ApiPropertyOptional({
    description: '评分规则(JSON格式)',
    example: {
      ranges: [
        { min: 0, max: 7, level: '无临床意义失眠', description: '睡眠正常' },
        { min: 8, max: 14, level: '亚临床失眠', description: '轻度失眠' },
        { min: 15, max: 21, level: '中度失眠', description: '中度失眠症状' },
        { min: 22, max: 28, level: '重度失眠', description: '严重失眠症状' },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  scoringRules?: any;
}

export class UpdateScaleConfigDto {
  @ApiPropertyOptional({ description: '量表名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '题目总数' })
  @IsOptional()
  @IsInt()
  totalItems?: number;

  @ApiPropertyOptional({ description: '最高分数' })
  @IsOptional()
  @IsInt()
  maxScore?: number;

  @ApiPropertyOptional({ description: '题目配置(JSON格式)' })
  @IsOptional()
  @IsArray()
  questions?: any;

  @ApiPropertyOptional({ description: '评分规则(JSON格式)' })
  @IsOptional()
  @IsObject()
  scoringRules?: any;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

// 提交量表记录DTO
export class SubmitScaleRecordDto {
  @ApiProperty({ description: '患者ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  patientId: number;

  @ApiProperty({ description: '量表配置ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  scaleId: number;

  @ApiProperty({
    description: '阶段',
    enum: ['V1', 'V2', 'V3', 'V4'],
    example: 'V1',
  })
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  @IsNotEmpty()
  stage: string;

  @ApiProperty({
    description: '答案数组(每题的分值)',
    example: [2, 3, 1, 2, 3, 2, 1],
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  answers: number[];
}

// 查询量表记录DTO
export class QueryScaleRecordDto {
  @ApiPropertyOptional({ description: '患者ID' })
  @IsOptional()
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({ description: '量表配置ID' })
  @IsOptional()
  @IsInt()
  scaleId?: number;

  @ApiPropertyOptional({
    description: '阶段',
    enum: ['V1', 'V2', 'V3', 'V4'],
  })
  @IsOptional()
  @IsEnum(['V1', 'V2', 'V3', 'V4'])
  stage?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
