import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScaleService } from './scale.service';
import { ScaleController } from './scale.controller';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { Patient } from '../../database/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScaleConfig, ScaleRecord, Patient])],
  providers: [ScaleService],
  controllers: [ScaleController],
  exports: [ScaleService],
})
export class ScaleModule {}
