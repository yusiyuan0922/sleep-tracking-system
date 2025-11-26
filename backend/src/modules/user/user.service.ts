import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserProfileDto, UpdateUserStatusDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 获取用户个人信息(根据用户ID)
   */
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return user;
  }

  /**
   * 更新用户个人信息
   */
  async updateProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.getProfile(userId);

    // 更新允许修改的字段
    if (updateUserProfileDto.name !== undefined) {
      user.name = updateUserProfileDto.name;
    }
    if (updateUserProfileDto.gender !== undefined) {
      user.gender = updateUserProfileDto.gender;
    }
    if (updateUserProfileDto.birthDate !== undefined) {
      user.birthDate = new Date(updateUserProfileDto.birthDate);
    }
    if (updateUserProfileDto.phone !== undefined) {
      user.phone = updateUserProfileDto.phone;
    }
    if (updateUserProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = updateUserProfileDto.avatarUrl;
    }

    return await this.userRepository.save(user);
  }

  /**
   * 更新用户状态(仅管理员)
   */
  async updateStatus(
    userId: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    const user = await this.getProfile(userId);
    user.status = updateUserStatusDto.status;
    return await this.userRepository.save(user);
  }

  /**
   * 根据ID获取用户详细信息
   */
  async findOne(id: number): Promise<User> {
    return this.getProfile(id);
  }

  /**
   * 获取所有用户列表(仅管理员)
   */
  async findAll(page = 1, pageSize = 10, role?: string, status?: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 按角色筛选
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // 按状态筛选
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // 排序和分页
    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
