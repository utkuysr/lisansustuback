export type PasswordPolicyResult = { ok: true } | { ok: false; message: string };

// Policy:
// - at least 8 chars
// - at least 1 lowercase, 1 uppercase, 1 digit, 1 special
// - no whitespace
export const PASSWORD_POLICY_REGEX =
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/;

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, message: 'Şifre zorunludur.' };
  }
  if (!PASSWORD_POLICY_REGEX.test(password)) {
    return {
      ok: false,
      message:
        'Şifre en az 8 karakter olmalı; en az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter içermeli ve boşluk içermemelidir.',
    };
  }
  return { ok: true };
}

