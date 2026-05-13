import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { Program } from './entities/program.entity';
import { ProgramCommissioner } from './entities/program-commissioner.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Institute } from 'src/institute/entities/institute.entity';
import { User } from 'src/users/entities/user.entity';
import { InstituteManagersModule } from 'src/institute-managers/institute-managers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program, ProgramCommissioner, Department, Institute, User]),
    InstituteManagersModule,
  ],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
