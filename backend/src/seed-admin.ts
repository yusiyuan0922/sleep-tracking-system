import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { AdminService } from './modules/admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    // 检查是否已存在管理员账户
    const existingAdmin = await adminService.findByUsername('admin');

    if (existingAdmin) {
      console.log('管理员账户已存在，删除旧账户并重新创建...');
      await adminService.remove(existingAdmin.id);
    }

    // 创建初始超级管理员账户
    await adminService.create({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'super_admin',
    });

    console.log('初始管理员账户创建成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请登录后立即修改密码！');
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
