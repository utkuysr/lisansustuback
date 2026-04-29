export const UserRole = {
  ADMIN: 'admin',
  KOMISYON_UYESI: 'Komisyon Üyesi',
  STUDENT: 'student',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
