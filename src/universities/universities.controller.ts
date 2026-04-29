import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('universities')
@UseGuards(JwtAuthGuard)
export class UniversitiesController {
  constructor(private readonly service: UniversitiesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
