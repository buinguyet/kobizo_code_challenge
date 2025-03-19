import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../types/database';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

@Injectable()
export class TaskService {
  constructor(
    private supabaseService: SupabaseService,
    private logger: Logger,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
  ): Promise<PostgrestSingleResponse<Tables<'tasks'>> | null> {
    try {
      this.logger.log(`Creating task ${JSON.stringify(createTaskDto)}`);
      const response = await this.supabaseService.client
        .from('tasks')
        .insert(createTaskDto);

      if (!response) {
        this.logger.error('No response received from Supabase');
        throw new InternalServerErrorException(
          'No response received from Supabase',
        );
      }

      const { data, error } = response;

      if (error) {
        this.logger.error(`Error creating task ${JSON.stringify(error)}`);
        throw new InternalServerErrorException(error.message);
      }

      this.logger.log(`Task created ${JSON.stringify(createTaskDto)}`);

      return data;
    } catch (error) {
      this.logger.error(`Error creating task ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(
    userId: string,
  ): Promise<PostgrestSingleResponse<Tables<'tasks'>[]>> {
    try {
      const data = await this.supabaseService.client
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      this.logger.log(`Tasks found ${JSON.stringify(data)}`);

      return data;
    } catch (error) {
      this.logger.error(`Error finding tasks ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string, userId: string): Promise<Tables<'tasks'> | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      this.logger.log(`Task found ${JSON.stringify(data)}`);
      if (error || !data) {
        this.logger.error(`Error finding task ${JSON.stringify(error)}`);
        throw new NotFoundException('Task not found');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding task ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findSubtasks(
    id: string,
    userId: string,
  ): Promise<PostgrestSingleResponse<Tables<'tasks'>[]>> {
    try {
      const data = await this.supabaseService.client
        .from('tasks')
        .select('*')
        .eq('parent_id', id)
        .eq('user_id', userId);

      this.logger.log(`Subtasks found ${JSON.stringify(data)}`);

      return data;
    } catch (error) {
      this.logger.error(`Error finding subtasks ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<void> {
    try {
      // check if task exists
      this.logger.log(
        `Updating task ${id} with ${JSON.stringify(updateTaskDto)}`,
      );
      const { data, error } = await this.supabaseService.client
        .from('tasks')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      this.logger.log(`Task found ${JSON.stringify(data)}`);
      if (error || !data) {
        this.logger.error(`Error finding task ${JSON.stringify(error)}`);
        throw new NotFoundException('Task not found');
      }

      // update task
      const { data: updatedData, error: updateError } =
        await this.supabaseService.client
          .from('tasks')
          .update(updateTaskDto)
          .eq('id', id);

      if (updateError) {
        this.logger.error(`Error updating task ${JSON.stringify(updateError)}`);
        throw new InternalServerErrorException(updateError.message);
      }

      this.logger.log(`Task updated ${JSON.stringify(updatedData)}`);
    } catch (error) {
      this.logger.error(`Error updating task ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // check if task exists
      const { data, error } = await this.supabaseService.client
        .from('tasks')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      this.logger.log(`Task found ${JSON.stringify(data)}`);
      if (error || !data) {
        this.logger.error(`Error finding task ${JSON.stringify(error)}`);
        throw new NotFoundException('Task not found');
      }

      // delete task
      const { error: deleteError } = await this.supabaseService.client
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        this.logger.error(`Error deleting task ${JSON.stringify(deleteError)}`);
        throw new InternalServerErrorException(deleteError.message);
      }

      this.logger.log(`Task deleted ${JSON.stringify(data)}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting task ${error}`);
      throw new InternalServerErrorException(error.message);
    }
  }
}
