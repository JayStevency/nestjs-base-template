import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateUserDto, UpdateUserDto, IUser } from '@app/shared';
import * as bcrypt from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return bcrypt.createHash('sha256').update(password).digest('hex');
  }

  async create(data: CreateUserDto): Promise<IUser> {
    const hashedPassword = this.hashPassword(data.password);
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
    const { password, ...result } = user;
    return result as IUser;
  }

  async findAll(): Promise<IUser[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findById(id: number): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<IUser> {
    const updateData: Partial<UpdateUserDto & { password?: string }> = { ...data };
    if (data.password) {
      updateData.password = this.hashPassword(data.password);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async delete(id: number): Promise<IUser> {
    const user = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }
}
