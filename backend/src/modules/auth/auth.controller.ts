import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { WxLoginDto, LoginResponseDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

export class AdminLoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('admin-login')
  @ApiOperation({ summary: '管理员登录' })
  async adminLogin(@Body() loginDto: AdminLoginDto): Promise<LoginResponseDto> {
    return this.authService.adminLogin(loginDto.username, loginDto.password);
  }

  @Public()
  @Post('wx-login')
  @ApiOperation({ summary: '微信登录' })
  async wxLogin(@Body() loginDto: WxLoginDto): Promise<LoginResponseDto> {
    return this.authService.wxLogin(loginDto.code);
  }
}
