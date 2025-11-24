import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { UserService } from './user.service';
import { RabbitmqService } from '@app/rabbitmq';
import {
  USER_PATTERNS,
  CreateUserDto,
  UpdateUserDto,
  RpcResponse,
  IUser,
} from '@app/shared';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rmqService: RabbitmqService,
  ) {}

  @MessagePattern(USER_PATTERNS.CREATE_USER)
  async createUser(
    @Payload() data: CreateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<RpcResponse<IUser>> {
    try {
      const user = await this.userService.create(data);
      this.rmqService.ack(context);
      return { success: true, data: user };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'CREATE_USER_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL_USERS)
  async findAllUsers(@Ctx() context: RmqContext): Promise<RpcResponse<IUser[]>> {
    try {
      const users = await this.userService.findAll();
      this.rmqService.ack(context);
      return { success: true, data: users };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'FIND_ALL_USERS_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_USER_BY_ID)
  async findUserById(
    @Payload() data: { id: number },
    @Ctx() context: RmqContext,
  ): Promise<RpcResponse<IUser>> {
    try {
      const user = await this.userService.findById(data.id);
      this.rmqService.ack(context);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with id ${data.id} not found`,
          },
        };
      }
      return { success: true, data: user };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'FIND_USER_BY_ID_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_USER_BY_EMAIL)
  async findUserByEmail(
    @Payload() data: { email: string },
    @Ctx() context: RmqContext,
  ): Promise<RpcResponse<IUser>> {
    try {
      const user = await this.userService.findByEmail(data.email);
      this.rmqService.ack(context);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with email ${data.email} not found`,
          },
        };
      }
      return { success: true, data: user };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'FIND_USER_BY_EMAIL_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern(USER_PATTERNS.UPDATE_USER)
  async updateUser(
    @Payload() data: { id: number; updateData: UpdateUserDto },
    @Ctx() context: RmqContext,
  ): Promise<RpcResponse<IUser>> {
    try {
      const user = await this.userService.update(data.id, data.updateData);
      this.rmqService.ack(context);
      return { success: true, data: user };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'UPDATE_USER_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern(USER_PATTERNS.DELETE_USER)
  async deleteUser(
    @Payload() data: { id: number },
    @Ctx() context: RmqContext,
  ): Promise<RpcResponse<IUser>> {
    try {
      const user = await this.userService.delete(data.id);
      this.rmqService.ack(context);
      return { success: true, data: user };
    } catch (error) {
      this.rmqService.ack(context);
      return {
        success: false,
        error: {
          code: 'DELETE_USER_ERROR',
          message: error.message,
        },
      };
    }
  }
}
