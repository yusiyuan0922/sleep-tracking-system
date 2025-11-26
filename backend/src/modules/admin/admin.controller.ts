import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto, ChangePasswordDto } from './dto/admin.dto';

@ApiTags('管理员管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: '创建管理员' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取管理员列表' })
  findAll(@Query() query: any) {
    return this.adminService.findAll(query);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取管理员详情' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: '更新管理员信息' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: '修改密码' })
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.adminService.changePassword(+id, changePasswordDto);
  }

  @Patch(':id/status')
  @Roles('super_admin')
  @ApiOperation({ summary: '更新管理员状态' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateStatus(+id, status);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: '删除管理员' })
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
