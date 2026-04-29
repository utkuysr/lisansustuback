import { IsBoolean, IsEmail, IsOptional, IsString, IsNumber, Matches } from 'class-validator';
import { PASSWORD_POLICY_REGEX } from 'src/auth/utils/password-policy';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(PASSWORD_POLICY_REGEX, {
    message:
      'Şifre en az 8 karakter olmalı; en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter içermeli ve boşluk içermemelidir.',
  })
  password?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  roleId?: number;
}
