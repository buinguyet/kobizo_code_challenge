import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRole } from '../common/constant';
import { ExchangeTokenDto } from './dto/exchange-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private readonly logger: Logger,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      // Check if the email already exists
      this.logger.log('Checking if email already exists');
      const { data: existingUser, error: existingUserError } =
        await this.supabaseService.client
          .from('profiles')
          .select('id, email')
          .eq('email', registerDto.email.toLowerCase())
          .maybeSingle();
      this.logger.log(`Existing user: ${existingUser}`);

      if (existingUser || existingUserError) {
        this.logger.log(`Email already exists: ${existingUser}`);
        throw new ConflictException('Email is already in use.');
      }

      // Register the user
      const { error } = await this.supabaseService.client.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            role: UserRole.USER,
          },
        },
      });

      if (error) {
        this.logger.error(`Error registering user: ${error}`);
        throw new InternalServerErrorException(error.message);
      }

      this.logger.log(`User registered successfully: ${registerDto.email}`);

      return { message: 'User registered successfully' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error registering user: ${error}`);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    id: string;
    email: string;
    role: string;
  }> {
    try {
      this.logger.log('Logging in user');
      const { data, error } =
        await this.supabaseService.client.auth.signInWithPassword({
          email: loginDto.email,
          password: loginDto.password,
        });

      if (error) {
        this.logger.error(`Error logging in user: ${error}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`Login successful: ${JSON.stringify(data)}`);

      return {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error logging in user: ${error}`);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  async exchangeToken(exchangeTokenDto: ExchangeTokenDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const { data, error } =
      await this.supabaseService.client.auth.refreshSession({
        refresh_token: exchangeTokenDto.refreshToken,
      });

    if (error) {
      this.logger.error(`Error exchanging token: ${error}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    };
  }
}
