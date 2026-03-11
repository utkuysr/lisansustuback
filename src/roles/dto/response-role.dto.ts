import { IsString } from 'class-validator';

export class RoleResponseDto {
  @IsString()
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  isActive: boolean;
}
