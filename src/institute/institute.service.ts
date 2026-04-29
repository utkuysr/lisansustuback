import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from './entities/institute.entity';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class InstituteService {
  constructor(
    @InjectRepository(Institute)
    private readonly instituteRepository: Repository<Institute>,
  ) {}

  async create(createDto: CreateInstituteDto, admin: User | { sub?: number; id?: number }) {
    if (!createDto?.name) {
      throw new Error('Institute name is required');
    }
    const actor = admin as any;
    const createdBy = { id: actor?.sub ?? actor?.id } as any;
    const institute = this.instituteRepository.create({ ...createDto, createdBy });
    return this.instituteRepository.save(institute);
  }

  async findAll() {
    return this.instituteRepository.find({ relations: ['createdBy'] });
  }

  async findOne(id: number) {
    const institute = await this.instituteRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!institute) throw new NotFoundException('Enstitü bulunamadı.');
    return institute;
  }

  async update(id: number, updateDto: UpdateInstituteDto) {
    const institute = await this.findOne(id);
    Object.assign(institute, updateDto);
    institute.updatedAt = new Date();
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
