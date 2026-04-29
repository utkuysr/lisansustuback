import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from './entities/university.entity';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([University])],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
