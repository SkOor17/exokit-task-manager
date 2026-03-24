import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    WorkOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
