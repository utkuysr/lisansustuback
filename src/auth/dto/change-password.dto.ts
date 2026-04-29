import { IsString, Matches } from 'class-validator';
import { PASSWORD_POLICY_REGEX } from 'src/auth/utils/password-policy';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Matches(PASSWORD_POLICY_REGEX, {
    message:
      'Yeni şifre en az 8 karakter olmalı; en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter içermeli ve boşluk içermemelidir.',
  })
  newPassword: string;

  @IsString()
  @Matches(PASSWORD_POLICY_REGEX, {
    message:
      'Yeni şifre en az 8 karakter olmalı; en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter içermeli ve boşluk içermemelidir.',
  })
  confirmPassword: string;
}
