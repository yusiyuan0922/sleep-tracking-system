import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WxLoginDto, LoginResponseDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('wx-login')
  @ApiOperation({ summary: '微信登录' })
  async wxLogin(@Body() loginDto: WxLoginDto): Promise<LoginResponseDto> {
    return this.authService.wxLogin(loginDto.code);
  }
}
