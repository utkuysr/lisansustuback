import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({ description: 'Geçerli refresh token' })
    @IsString()
    refreshToken: string;
}
