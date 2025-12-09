import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicationRecord, ConcomitantMedication]),
    forwardRef(() => PatientModule),
  ],
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService],
})
export class MedicationModule {}
