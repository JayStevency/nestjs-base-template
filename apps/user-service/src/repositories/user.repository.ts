import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  PrismaService,
  TransactionHost,
  TransactionalAdapterPrisma,
} from '@app/prisma';
import { UserEntity, IUser } from '../entities';

const USER_SELECT_WITHOUT_PASSWORD = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserRepository extends BaseRepository<'User'> {
  constructor(
    prisma: PrismaService,
    txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {
    super(prisma, 'user', txHost);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findUnique({ email });
  }

  async findByIdWithoutPassword(id: number): Promise<IUser | null> {
    return this.findById(id, USER_SELECT_WITHOUT_PASSWORD) as Promise<IUser | null>;
  }

  async findAllWithoutPassword(): Promise<IUser[]> {
    return this.findMany(
      undefined,
      USER_SELECT_WITHOUT_PASSWORD,
    ) as Promise<IUser[]>;
  }
}
