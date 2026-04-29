import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionStatus } from '../entities/decision.entity';

export class UpdateDecisionDto {
    @ApiPropertyOptional({ enum: DecisionStatus })
    @IsOptional()
    @IsEnum(DecisionStatus)
    status?: DecisionStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ minimum: 0, maximum: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    score?: number;
}
