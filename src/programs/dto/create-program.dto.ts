import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DegreeType } from '../entities/program.entity';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  Quota: number;

  @IsString()
  @IsOptional()
  Description?: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  ApplicationStartdate: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  ApplicationEnddate: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  EvaluationDate: Date;

  @IsOptional()
  @IsEnum(DegreeType)
  degreeType?: DegreeType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Minimum score requirements
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minAlesScore?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  @Type(() => Number)
  minGpa?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minLanguageScore?: number;

  @IsOptional()
  @IsBoolean()
  languageExamRequired?: boolean;

  // Scoring weights
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  alesWeight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  gpaWeight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  interviewWeight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  writtenExamWeight?: number;

  // Written exam (Bilim Sınavı)
  @IsOptional()
  @IsBoolean()
  hasWrittenExam?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  writtenExamDate?: Date;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  writtenExamMinScore?: number;

  // Interview (Mülakat)
  @IsOptional()
  @IsBoolean()
  hasInterview?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  interviewDate?: Date;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  interviewMinScore?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  @Type(() => Number)
  jurySize?: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  instituteId?: number;
}
