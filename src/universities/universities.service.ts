import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './entities/university.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly repo: Repository<University>,
  ) {}

  findAll(): Promise<University[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<University> {
    const u = await this.repo.findOneBy({ id });
    if (!u) throw new NotFoundException('Üniversite bulunamadı.');
    return u;
  }
}
