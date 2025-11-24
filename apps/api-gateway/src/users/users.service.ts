import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpcSend } from '@app/rabbitmq';
import {
  SERVICES,
  USER_PATTERNS,
  CreateUserDto,
  UpdateUserDto,
  RpcResponse,
  IUser,
} from '@app/shared';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SERVICES.USER_SERVICE)
    private readonly userClient: ClientProxy,
  ) {}

  async create(data: CreateUserDto): Promise<RpcResponse<IUser>> {
    return rpcSend(this.userClient, USER_PATTERNS.CREATE_USER, data);
  }

  async findAll(): Promise<RpcResponse<IUser[]>> {
    return rpcSend(this.userClient, USER_PATTERNS.FIND_ALL_USERS, {});
  }

  async findById(id: number): Promise<RpcResponse<IUser>> {
    return rpcSend(this.userClient, USER_PATTERNS.FIND_USER_BY_ID, { id });
  }

  async findByEmail(email: string): Promise<RpcResponse<IUser>> {
    return rpcSend(this.userClient, USER_PATTERNS.FIND_USER_BY_EMAIL, { email });
  }

  async update(id: number, updateData: UpdateUserDto): Promise<RpcResponse<IUser>> {
    return rpcSend(this.userClient, USER_PATTERNS.UPDATE_USER, { id, updateData });
  }

  async delete(id: number): Promise<RpcResponse<IUser>> {
    return rpcSend(this.userClient, USER_PATTERNS.DELETE_USER, { id });
  }
}
