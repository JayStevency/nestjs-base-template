import { Module } from '@nestjs/common';
import { CoreModule } from '@app/core';
import { PrismaModule } from '@app/prisma';
import { RabbitmqModule } from '@app/rabbitmq';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    CoreModule.forRoot('user-service'),
    PrismaModule,
    RabbitmqModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserServiceModule {}
