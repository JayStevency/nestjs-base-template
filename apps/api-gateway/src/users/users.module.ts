import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RabbitmqModule } from '@app/rabbitmq';
import { SERVICES, QUEUES } from '@app/shared';

@Module({
  imports: [
    RabbitmqModule.register({
      name: SERVICES.USER_SERVICE,
      queue: QUEUES.USER_QUEUE,
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
