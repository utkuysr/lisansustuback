import { Expose, Type } from 'class-transformer';

export class RoleDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() description: string;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
}

export class UserResponseDto {
  @Expose() id: number;
  @Expose() username: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() userType: string;
  @Expose() isActive: boolean;
  @Expose() createDate: Date;
  @Expose() updateDate: Date;
  @Expose() profileImageUrl: string;
  @Expose() phone: string;
  @Expose() isEmailVerified: boolean;

  @Expose()
  @Type(() => RoleDto)
  role: RoleDto;
}