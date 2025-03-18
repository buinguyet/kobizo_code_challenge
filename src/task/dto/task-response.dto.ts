import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../common/constant';

export class TaskResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    example: 'Implement user authentication',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'Implement JWT authentication using Supabase',
  })
  description?: string;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parent_id?: string;

  @ApiProperty({
    example: '2024-03-17T12:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-03-17T12:00:00Z',
  })
  updated_at: Date;
}
