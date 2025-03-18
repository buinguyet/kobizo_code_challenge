import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../common/constant';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true; // No role restriction
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`Required roles: ${requiredRoles.join(', ')}`);
    this.logger.debug(`User: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.error('No user found in request');
      throw new ForbiddenException('User not found');
    }

    if (!user.role) {
      this.logger.error('No role found in user object');
      throw new ForbiddenException('User role not found');
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.error(
        `User role ${user.role} not in required roles ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
