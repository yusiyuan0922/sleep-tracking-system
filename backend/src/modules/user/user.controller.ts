import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserProfileDto, UpdateUserStatusDto } from './dto/user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '获取当前用户的个人信息' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user.userId);
  }

  @Patch('profile')
  @Roles('super_admin', 'admin', 'doctor', 'patient')
  @ApiOperation({ summary: '更新当前用户的个人信息' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(user.userId, updateUserProfileDto);
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取所有用户列表(仅管理员)' })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll(page, pageSize, role, status);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取指定用户详情(仅管理员)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '更新用户状态(仅管理员)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(id, updateUserStatusDto);
  }
}
