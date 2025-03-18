import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../../common/constant';

export class GetTasksQueryDto {
  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Filter tasks by status',
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter tasks by parent task ID',
  })
  @IsUUID()
  @IsOptional()
  parent_id?: string;
}
