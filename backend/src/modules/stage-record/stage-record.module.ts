import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StageRecordService } from './stage-record.service';
import { StageRecordController } from './stage-record.controller';
import { StageRecord } from '../../database/entities/stage-record.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([StageRecord]), AuditLogModule],
  controllers: [StageRecordController],
  providers: [StageRecordService],
  exports: [StageRecordService],
})
export class StageRecordModule {}
