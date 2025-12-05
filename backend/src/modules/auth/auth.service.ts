import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import axios from 'axios';
import { User } from '../../database/entities/user.entity';
import { Patient } from '../../database/entities/patient.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
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
  async wxLogin(code: string, phone?: string) {
    // 开发环境模拟登录
    if (process.env.NODE_ENV === 'development' &&
        (process.env.WECHAT_APP_ID === 'your_wechat_app_id' || !process.env.WECHAT_APP_ID)) {
      console.log('[开发模式] 使用模拟微信登录');
      return this.mockWxLogin(code, phone);
    }

    // 1. 调用微信API获取openid和session_key
    const { openid, sessionKey } = await this.getWxOpenId(code);

    // 2. 查找用户
    let user = await this.userRepository.findOne({ where: { openid } });

    // 3. 如果没找到且提供了手机号,尝试绑定管理员创建的账号
    if (!user && phone) {
      const adminCreatedUser = await this.userRepository.findOne({
        where: {
          phone,
          openid: Like('admin_created_%'),
        },
      });

      if (adminCreatedUser) {
        // 绑定:更新openid为真实微信openid
        adminCreatedUser.openid = openid;
        user = await this.userRepository.save(adminCreatedUser);

        console.log(`[绑定成功] 管理员创建的账号已绑定微信: userId=${user.id}, phone=${phone}`);
      }
    }

    // 4. 如果仍未找到,创建新用户(默认为患者角色)
    if (!user) {
      user = this.userRepository.create({
        openid,
        role: 'patient',
        name: '微信用户', // 默认名称,后续需要完善
        status: 'active',
      });
      await this.userRepository.save(user);
    }

    // 5. 查询患者或医生信息
    let patientId = null;
    let doctorId = null;

    if (user.role === 'patient') {
      const patient = await this.patientRepository.findOne({ where: { userId: user.id } });
      if (patient) {
        patientId = patient.id;
      }
    } else if (user.role === 'doctor') {
      const doctor = await this.doctorRepository.findOne({ where: { userId: user.id } });
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    // 6. 生成JWT Token
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
        patientId,
        doctorId,
      },
    };
  }

  /**
   * 开发环境模拟微信登录
   */
  private async mockWxLogin(code: string, phone?: string) {
    // 开发模式：使用固定的openid，避免每次登录都创建新用户
    // 如果需要测试新用户，可以手动修改这个值
    const mockOpenId = `mock_openid_fixed_patient`;

    console.log(`[开发模式] 使用固定的 mockOpenId: ${mockOpenId}`);

    let user = null;

    // 开发模式下，如果提供了手机号，直接通过手机号查找用户（方便调试，不需要每次重新绑定）
    if (phone) {
      user = await this.userRepository.findOne({ where: { phone } });
      if (user) {
        console.log(`[开发模式] 通过手机号找到用户: userId=${user.id}, role=${user.role}, phone=${phone}`);
      }
    }

    // 如果没有通过手机号找到，尝试通过openid查找
    if (!user) {
      user = await this.userRepository.findOne({ where: { openid: mockOpenId } });
    }

    // 如果没找到且提供了手机号,尝试绑定管理员创建的账号
    if (!user && phone) {
      const adminCreatedUser = await this.userRepository.findOne({
        where: {
          phone,
          openid: Like('admin_created_%'),
        },
      });

      if (adminCreatedUser) {
        // 绑定:更新openid为模拟openid
        adminCreatedUser.openid = mockOpenId;
        user = await this.userRepository.save(adminCreatedUser);

        console.log(`[开发模式][绑定成功] 管理员创建的账号已绑定: userId=${user.id}, phone=${phone}`);
      }
    }

    // 如果仍未找到,创建新用户
    if (!user) {
      user = this.userRepository.create({
        openid: mockOpenId,
        role: 'patient',
        name: '测试用户',
        status: 'active',
      });
      await this.userRepository.save(user);
    }

    // 查询患者或医生信息
    let patientId = null;
    let doctorId = null;

    if (user.role === 'patient') {
      const patient = await this.patientRepository.findOne({ where: { userId: user.id } });
      if (patient) {
        patientId = patient.id;
      }
    } else if (user.role === 'doctor') {
      const doctor = await this.doctorRepository.findOne({ where: { userId: user.id } });
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    // 生成JWT Token
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
        patientId,
        doctorId,
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
