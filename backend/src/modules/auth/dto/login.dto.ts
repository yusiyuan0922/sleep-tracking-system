import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WxLoginDto {
  @ApiProperty({ description: '微信登录code' })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Token' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    openid: string;
    role: string;
    name: string;
  };
}
