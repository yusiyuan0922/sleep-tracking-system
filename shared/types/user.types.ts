/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/**
 * 用户基础接口
 */
export interface IUser {
  id: number;
  openid: string;
  unionid?: string;
  role: UserRole;
  name: string;
  gender?: 'male' | 'female';
  birthDate?: Date;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
