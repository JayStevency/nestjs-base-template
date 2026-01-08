import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '@app/shared';
import { IUser } from './entities';
import { UserRepository } from './repositories';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async create(data: CreateUserDto): Promise<IUser> {
    const hashedPassword = this.hashPassword(data.password);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
    const { password, ...result } = user;
    return result as IUser;
  }

  async findAll(): Promise<IUser[]> {
    return this.userRepository.findAllWithoutPassword();
  }

  async findById(id: number): Promise<IUser | null> {
    return this.userRepository.findByIdWithoutPassword(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    const { password, ...result } = user;
    return result as IUser;
  }

  async update(id: number, data: UpdateUserDto): Promise<IUser> {
    const updateData: Partial<UpdateUserDto & { password?: string }> = { ...data };
    if (data.password) {
      updateData.password = this.hashPassword(data.password);
    }
    const user = await this.userRepository.updateById(id, updateData);
    const { password, ...result } = user;
    return result as IUser;
  }

  async delete(id: number): Promise<IUser> {
    const user = await this.userRepository.deleteById(id);
    const { password, ...result } = user;
    return result as IUser;
  }
}
