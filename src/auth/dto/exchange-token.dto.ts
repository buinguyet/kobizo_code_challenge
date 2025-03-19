import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh_token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
