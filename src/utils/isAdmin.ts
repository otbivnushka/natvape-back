import { User } from 'src/users/entities/user.entity';

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.isAdmin;
}
