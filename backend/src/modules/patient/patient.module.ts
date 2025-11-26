import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { Patient } from '../../database/entities/patient.entity';
import { User } from '../../database/entities/user.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { Hospital } from '../../database/entities/hospital.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, Doctor, Hospital])],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
