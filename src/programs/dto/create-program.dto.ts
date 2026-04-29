import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  Quota: number;

  @IsString()
  @IsNotEmpty()
  Description: string;

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
  @IsInt()
  @Type(() => Number)
  facultyId?: number;
}
