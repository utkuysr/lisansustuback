import { IsDate, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DegreeType } from 'src/programs/entities/program.entity';

export class CreateApplicationDto {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  ApplicationDate?: Date;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  GradePointAverage?: number;

  @IsOptional()
  @IsIn(['4.0', '100'])
  gpaScale?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  alesScore?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  ydsScore?: number;

  @IsOptional()
  @IsEnum(DegreeType)
  degreeType?: string;

  @IsOptional()
  @IsInt()
  userId?: number;

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

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  graduateUniversity: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  graduateFaculty?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  graduateDepartment: string;
}
