import { IsEmail, IsString, IsOptional, IsNumber, IsNotEmpty, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { PASSWORD_POLICY_REGEX } from 'src/auth/utils/password-policy';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PASSWORD_POLICY_REGEX, {
    message:
      'Şifre en az 8 karakter olmalı; en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter içermeli ve boşluk içermemelidir.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsOptional()
  @IsNumber()
  createdBy?: number;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

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
  @Type(() => Number)
  @IsNumber()
  roleId?: number;
}
