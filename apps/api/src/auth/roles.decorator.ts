import { SetMetadata } from '@nestjs/common';
import { AppRole } from './roles.enum';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles (ADMINISTRATOR always allowed). */
export const Roles = (...roles: AppRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
