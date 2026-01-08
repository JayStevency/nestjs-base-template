import { Module } from '@nestjs/common';
import { CoreModule } from '@app/core';
import { PrismaModule } from '@app/prisma';
import { RabbitmqModule } from '@app/rabbitmq';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories';

@Module({
  imports: [
    CoreModule.forRoot('user-service'),
    PrismaModule,
    RabbitmqModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserServiceModule {}
