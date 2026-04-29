import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionStatus } from '../entities/decision.entity';

export class CreateDecisionDto {
    @ApiProperty({ description: 'Karar verilecek başvurunun ID\'si' })
    @IsNumber()
    applicationId: number;

    @ApiProperty({ enum: DecisionStatus, description: 'Karar durumu' })
    @IsEnum(DecisionStatus)
    status: DecisionStatus;

    @ApiPropertyOptional({ description: 'Komisyon üyesinin değerlendirme notu' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Değerlendirme puanı (0-100)', minimum: 0, maximum: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    score?: number;
}
