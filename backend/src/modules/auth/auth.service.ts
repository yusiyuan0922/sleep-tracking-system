import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User } from '../../database/entities/user.entity';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}

  /**
   * 管理员登录
   */
  async adminLogin(username: string, password: string) {
    const admin = await this.adminService.validatePassword(username, password);

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成JWT Token
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        email: admin.email,
      },
    };
  }

  /**
   * 微信登录
   */
  async wxLogin(code: string) {
    // 1. 调用微信API获取openid和session_key
    const { openid, sessionKey } = await this.getWxOpenId(code);

    // 2. 查找或创建用户
    let user = await this.userRepository.findOne({ where: { openid } });

    if (!user) {
      // 首次登录,创建新用户(默认为患者角色)
      user = this.userRepository.create({
        openid,
        role: 'patient',
        name: '微信用户', // 默认名称,后续需要完善
        status: 'active',
      });
      await this.userRepository.save(user);
    }

    // 3. 生成JWT Token
    const payload = {
      sub: user.id,
      openid: user.openid,
      role: user.role,
      type: 'user',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        openid: user.openid,
        role: user.role,
        name: user.name,
      },
    };
  }

  /**
   * 调用微信API获取openid
   */
  private async getWxOpenId(code: string): Promise<{ openid: string; sessionKey: string }> {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      throw new UnauthorizedException('微信配置未设置');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session`;
    const params = {
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
      }

      return {
        openid: data.openid,
        sessionKey: data.session_key,
      };
    } catch (error) {
      throw new UnauthorizedException('微信登录失败');
    }
  }

  /**
   * 验证JWT Token
   */
  async validateUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }
}
