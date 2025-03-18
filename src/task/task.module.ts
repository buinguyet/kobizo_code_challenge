import { Logger, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, SupabaseModule],
  controllers: [TaskController],
  providers: [TaskService, Logger],
})
export class TaskModule {}
