import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../common/constant';
import { NotFoundException } from '@nestjs/common';

describe('TaskController', () => {
  let controller: TaskController;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findSubtasks: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        user_id: '1',
        status: TaskStatus.PENDING,
      };
      const result = { id: '1', ...createTaskDto };
      mockTaskService.create.mockResolvedValue(result);

      expect(await controller.create(createTaskDto)).toEqual(result);
      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a user', async () => {
      const req = { user: { id: '1' } };
      const result = [{ id: '1', title: 'Test Task', user_id: '1' }];
      mockTaskService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(req as any)).toEqual(result);
      expect(mockTaskService.findAll).toHaveBeenCalledWith('1');
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const req = { user: { id: '1' } };
      const result = { id: '1', title: 'Test Task', user_id: '1' };
      mockTaskService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1', req as any)).toEqual(result);
      expect(mockTaskService.findOne).toHaveBeenCalledWith('1', '1');
    });

    it('should throw NotFoundException if task not found', async () => {
      const req = { user: { id: '1' } };
      mockTaskService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('1', req as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findSubtasks', () => {
    it('should return all subtasks for a task', async () => {
      const req = { user: { id: '1' } };
      const result = [
        { id: '2', title: 'Subtask', user_id: '1', parent_id: '1' },
      ];
      mockTaskService.findSubtasks.mockResolvedValue(result);

      expect(await controller.findSubtasks('1', req as any)).toEqual(result);
      expect(mockTaskService.findSubtasks).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.DONE,
      };
      mockTaskService.update.mockResolvedValue(undefined);

      await controller.update('1', updateTaskDto);

      expect(mockTaskService.update).toHaveBeenCalledWith('1', updateTaskDto);
    });

    it('should throw NotFoundException if task not found', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.DONE,
      };
      mockTaskService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('1', updateTaskDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockTaskService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(mockTaskService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
