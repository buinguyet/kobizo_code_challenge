import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email for the account',
    example: 'john_doe@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Password for login',
    example: 'StrongP@ss123',
  })
  @IsString()
  password: string;
}
