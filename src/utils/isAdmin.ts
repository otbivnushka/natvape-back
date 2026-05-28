import { User } from '../users/entities/user.entity';

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.isAdmin;
}
