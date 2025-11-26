import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少6位' })
  password: string;

  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['super_admin', 'admin', 'operator'])
  @IsOptional()
  role?: 'super_admin' | 'admin' | 'operator';
}

export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['super_admin', 'admin', 'operator'])
  @IsOptional()
  role?: 'super_admin' | 'admin' | 'operator';

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码长度至少6位' })
  newPassword: string;
}
