import { User as PrismaUser } from '@prisma/client';

// Base entity from Prisma
export type UserEntity = PrismaUser;

// User without password (for API responses)
export interface IUser extends Omit<UserEntity, 'password'> {}

// User with password (for internal use)
export interface IUserWithPassword extends UserEntity {}

// Partial user for updates
export type IUserPartial = Partial<Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>>;
