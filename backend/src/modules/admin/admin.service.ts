import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from '../../entities/admin.entity';
import { CreateAdminDto, UpdateAdminDto, ChangePasswordDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: createAdminDto.username },
    });

    if (existingAdmin) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });

    const savedAdmin = await this.adminRepository.save(admin);
    delete savedAdmin.password; // 不返回密码
    return savedAdmin;
  }

  async findAll(params?: any): Promise<{ items: Admin[]; total: number }> {
    const { page = 1, pageSize = 10, role, status } = params || {};
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [items, total] = await this.adminRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      select: ['id', 'username', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    return { items, total };
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    return admin;
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    });
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);
    Object.assign(admin, updateAdminDto);
    const savedAdmin = await this.adminRepository.save(admin);
    delete savedAdmin.password;
    return savedAdmin;
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      admin.password,
    );

    if (!isOldPasswordValid) {
      throw new ConflictException('原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    admin.password = hashedPassword;
    await this.adminRepository.save(admin);
  }

  async updateStatus(id: number, status: string): Promise<Admin> {
    const admin = await this.findOne(id);
    admin.status = status as 'active' | 'inactive';
    const savedAdmin = await this.adminRepository.save(admin);
    delete savedAdmin.password;
    return savedAdmin;
  }

  async remove(id: number): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
  }

  async validatePassword(username: string, password: string): Promise<Admin | null> {
    const admin = await this.findByUsername(username);

    if (!admin) {
      return null;
    }

    // Check if password exists
    if (!admin.password) {
      return null;
    }

    if (!password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return null;
    }

    if (admin.status !== 'active') {
      return null;
    }

    return admin;
  }
}
