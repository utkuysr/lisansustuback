import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { Program } from './entities/program.entity';
import { Faculty } from 'src/faculties/entities/faculty.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramCommissioner } from './entities/program-commissioner.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Faculty, ProgramCommissioner, User])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
