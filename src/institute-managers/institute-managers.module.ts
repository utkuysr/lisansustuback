import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstituteManagersService } from './institute-managers.service';
import { InstituteManagersController } from './institute-managers.controller';
import { InstituteManager } from './entities/institute-manager.entity';
import { User } from 'src/users/entities/user.entity';
import { Institute } from 'src/institute/entities/institute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstituteManager, User, Institute])],
  controllers: [InstituteManagersController],
  providers: [InstituteManagersService],
  exports: [InstituteManagersService],
})
export class InstituteManagersModule {}
