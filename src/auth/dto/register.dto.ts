import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX } from '../../common/constant';

export class RegisterDto {
  @ApiProperty({
    description: 'Email for the account',
    example: 'john_doe@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description:
      'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character',
    example: 'StrongP@ss123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  password: string;
}
