import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  instituteId?: number;
}
