import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../common/constant';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
