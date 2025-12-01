import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WxLoginDto {
  @ApiProperty({ description: '微信登录code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '手机号(用于绑定管理员创建的账号)' })
  @IsOptional()
  @IsString()
  @Length(11, 11)
  phone?: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Token' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: any;
}
