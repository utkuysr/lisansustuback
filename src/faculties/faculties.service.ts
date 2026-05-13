import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { University } from 'src/universities/entities/university.entity';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty)
    private readonly repo: Repository<Faculty>,
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>,
  ) {}

  findAll(universityId?: number): Promise<Faculty[]> {
    const where: any = universityId ? { university: { id: universityId } } : {};
    return this.repo.find({ where, relations: ['university'], order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Faculty> {
    const f = await this.repo.findOne({ where: { id }, relations: ['university'] });
    if (!f) throw new NotFoundException('Fakülte bulunamadı.');
    return f;
  }

  async create(dto: CreateFacultyDto): Promise<Faculty> {
    const existing = await this.repo.findOneBy({ name: dto.name });
    if (existing) throw new BadRequestException('Bu isimde bir fakülte zaten mevcut.');

    let university: University | undefined;
    if (dto.universityId) {
      const u = await this.universityRepo.findOneBy({ id: dto.universityId });
      if (!u) throw new NotFoundException('Üniversite bulunamadı.');
      university = u;
    }

    return this.repo.save(this.repo.create({ name: dto.name, description: dto.description, university }));
  }

  async update(id: number, dto: UpdateFacultyDto): Promise<Faculty> {
    const faculty = await this.findOne(id);

    if (dto.universityId !== undefined) {
      if (!dto.universityId) {
        faculty.university = undefined;
      } else {
        const u = await this.universityRepo.findOneBy({ id: dto.universityId });
        if (!u) throw new NotFoundException('Üniversite bulunamadı.');
        faculty.university = u;
      }
    }

    if (dto.name !== undefined) faculty.name = dto.name;
    if (dto.description !== undefined) faculty.description = dto.description;
    faculty.updatedAt = new Date();
    return this.repo.save(faculty);
  }

  async remove(id: number): Promise<{ message: string }> {
    const faculty = await this.findOne(id);
    await this.repo.softRemove(faculty);
    return { message: 'Fakülte silindi.' };
  }
}
