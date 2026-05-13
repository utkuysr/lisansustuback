import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institute } from './entities/institute.entity';
import { User } from 'src/users/entities/user.entity';
import { University } from 'src/universities/entities/university.entity';
import { InstituteService } from './institute.service';
import { InstituteController } from './institute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institute, User, University])],
  controllers: [InstituteController],
  providers: [InstituteService],
  exports: [InstituteService],
})
export class InstituteModule {}
