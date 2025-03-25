import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTasksQueryDto {
  @ApiPropertyOptional({
    description: 'Limit',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;
}
