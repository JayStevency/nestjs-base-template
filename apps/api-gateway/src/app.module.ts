import { Module } from '@nestjs/common';
import { CoreModule } from '@app/core';
import { PrismaModule } from '@app/prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CoreModule.forRoot('api-gateway'),
    PrismaModule,
    HealthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
