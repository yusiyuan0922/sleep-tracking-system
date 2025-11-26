import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WxLoginDto, LoginResponseDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

export class AdminLoginDto {
  username: string;
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
    console.log('[AdminLogin Controller] Received login request:', { username: loginDto.username, hasPassword: !!loginDto.password });
    return this.authService.adminLogin(loginDto.username, loginDto.password);
  }

  @Public()
  @Post('wx-login')
  @ApiOperation({ summary: '微信登录' })
  async wxLogin(@Body() loginDto: WxLoginDto): Promise<LoginResponseDto> {
    return this.authService.wxLogin(loginDto.code);
  }
}
