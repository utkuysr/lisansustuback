import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from './entities/institute.entity';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { User } from 'src/users/entities/user.entity';
import { University } from 'src/universities/entities/university.entity';

@Injectable()
export class InstituteService {
  constructor(
    @InjectRepository(Institute)
    private readonly instituteRepository: Repository<Institute>,
    @InjectRepository(University)
    private readonly universityRepo: Repository<University>,
  ) {}

  async create(createDto: CreateInstituteDto, admin: User | { sub?: number; id?: number }) {
    if (!createDto?.name) throw new Error('Institute name is required');

    let university: University | undefined;
    if (createDto.universityId) {
      const u = await this.universityRepo.findOneBy({ id: createDto.universityId });
      if (!u) throw new NotFoundException('Üniversite bulunamadı.');
      university = u;
    }

    const actor = admin as any;
    const createdBy = { id: actor?.sub ?? actor?.id } as any;
    const institute = this.instituteRepository.create({ name: createDto.name, university, createdBy });
    return this.instituteRepository.save(institute);
  }

  async findAll(universityId?: number) {
    const where: any = universityId ? { university: { id: universityId } } : {};
    return this.instituteRepository.find({ where, relations: ['createdBy', 'university'] });
  }

  async findOne(id: number) {
    const institute = await this.instituteRepository.findOne({
      where: { id },
      relations: ['createdBy', 'university'],
    });
    if (!institute) throw new NotFoundException('Enstitü bulunamadı.');
    return institute;
  }

  async update(id: number, updateDto: UpdateInstituteDto, updatedBy?: number) {
    const institute = await this.findOne(id);

    if (updateDto.universityId !== undefined) {
      if (!updateDto.universityId) {
        institute.university = undefined;
      } else {
        const u = await this.universityRepo.findOneBy({ id: updateDto.universityId });
        if (!u) throw new NotFoundException('Üniversite bulunamadı.');
        institute.university = u;
      }
    }

    if (updateDto.name !== undefined) institute.name = updateDto.name;
    institute.updatedAt = new Date();
    institute.updatedBy = updatedBy;
    return this.instituteRepository.save(institute);
  }

  async archive(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.instituteRepository.softDelete(id);
    return { message: 'Enstitü arşivlendi.' };
  }

  async restore(id: number): Promise<{ message: string }> {
    const result = await this.instituteRepository.restore(id);
    if (!result.affected) throw new NotFoundException('Arşivde böyle bir enstitü bulunamadı.');
    return { message: 'Enstitü arşivden geri alındı.' };
  }

  async remove(id: number) {
    const institute = await this.findOne(id);
    return this.instituteRepository.remove(institute);
  }
}
