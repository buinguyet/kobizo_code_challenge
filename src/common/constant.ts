export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const LIMIT = 10;
