export const UserRole = {
  ADMIN: 'admin',
  KOMISYON_UYESI: 'Komisyon Üyesi',
  STUDENT: 'student',
  INSTITUTE_MANAGER: 'institute_manager',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
