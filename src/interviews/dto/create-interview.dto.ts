import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { InterviewStatus } from '../entities/interview.entity';

export class CreateInterviewDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  applicationId: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  scheduledAt: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  interviewerId?: number;
}
