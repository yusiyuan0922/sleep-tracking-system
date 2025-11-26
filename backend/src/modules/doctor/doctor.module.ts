import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from '../../database/entities/doctor.entity';
import { User } from '../../database/entities/user.entity';
import { Hospital } from '../../database/entities/hospital.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User, Hospital])],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
