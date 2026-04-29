import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty)
    private readonly repo: Repository<Faculty>,
  ) {}

  findAll(): Promise<Faculty[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Faculty> {
    const f = await this.repo.findOneBy({ id });
    if (!f) throw new NotFoundException('Fakülte bulunamadı.');
    return f;
  }

  async create(dto: CreateFacultyDto): Promise<Faculty> {
    const existing = await this.repo.findOneBy({ name: dto.name });
    if (existing) throw new BadRequestException('Bu isimde bir fakülte zaten mevcut.');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateFacultyDto): Promise<Faculty> {
    const faculty = await this.findOne(id);
    Object.assign(faculty, dto);
    faculty.updatedAt = new Date();
    return this.repo.save(faculty);
  }

  async remove(id: number): Promise<{ message: string }> {
    const faculty = await this.findOne(id);
    await this.repo.softRemove(faculty);
    return { message: 'Fakülte silindi.' };
  }
}
