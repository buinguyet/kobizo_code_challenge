import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/constant';

export class UserProfileDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
  })
  user_id: number;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john_doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'USER',
    enum: UserRole,
  })
  role: string;
}
