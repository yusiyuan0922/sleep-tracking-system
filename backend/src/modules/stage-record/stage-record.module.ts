import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StageRecordService } from './stage-record.service';
import { StageRecordController } from './stage-record.controller';
import { StageRecord } from '../../database/entities/stage-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StageRecord])],
  controllers: [StageRecordController],
  providers: [StageRecordService],
  exports: [StageRecordService],
})
export class StageRecordModule {}
