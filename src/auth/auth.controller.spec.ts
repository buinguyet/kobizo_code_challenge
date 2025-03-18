import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/constant';
import { UnauthorizedException } from '@nestjs/common';

// Mock SupabaseService
const mockSupabaseService = {
  client: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    })),
  },
};

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: 'SupabaseService',
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'testuser@example.com',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
      const expectedResult = { message: 'User registered successfully' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle registration errors', async () => {
      const errorMessage = 'Registration failed';
      mockAuthService.register.mockRejectedValueOnce(new Error(errorMessage));

      await expect(controller.register(registerDto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should handle email already exists', async () => {
      const errorMessage = 'Email already exists';
      mockAuthService.register.mockRejectedValueOnce(new Error(errorMessage));

      await expect(controller.register(registerDto)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'testuser@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      const expectedResult = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 1,
      email: 'testuser@example.com',
      role: UserRole.USER,
    };

    const mockRequest = {
      user: mockUser,
    };

    it('should get user profile successfully', async () => {
      const result = await controller.getProfile(mockRequest as any);

      expect(result).toEqual(mockUser);
    });

    it('should handle request without user', async () => {
      const invalidRequest = {} as any;
      const result = await controller.getProfile(invalidRequest);

      expect(result).toEqual(undefined);
    });
  });
});
