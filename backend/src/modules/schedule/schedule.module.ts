import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleTasksService } from './schedule-tasks.service';
import { Patient } from '../../database/entities/patient.entity';
import { PushMessageModule } from '../push-message/push-message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    PushMessageModule,
  ],
  providers: [ScheduleTasksService],
  exports: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
