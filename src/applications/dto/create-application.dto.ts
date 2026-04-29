import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @IsDate()
  @Type(() => Date)
  ApplicationDate: Date;

  @IsString()
  @IsOptional()
  status: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  GradePointAverage: number;

  @IsOptional()
  @IsInt()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  programId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  universityId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;
}
