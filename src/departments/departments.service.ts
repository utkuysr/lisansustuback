import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Institute } from 'src/institute/entities/institute.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly repo: Repository<Department>,
    @InjectRepository(Institute)
    private readonly instituteRepo: Repository<Institute>,
  ) {}

  findAll(instituteId?: number, withArchived = false): Promise<Department[]> {
    const where: any = instituteId ? { institute: { id: instituteId } } : {};
    return this.repo.find({ where, relations: ['institute'], order: { name: 'ASC' }, withDeleted: withArchived });
  }

  findArchived(instituteId?: number): Promise<Department[]> {
    const where: any = { deletedAt: Not(IsNull()), ...(instituteId ? { institute: { id: instituteId } } : {}) };
    return this.repo.find({ where, relations: ['institute'], order: { deletedAt: 'DESC' }, withDeleted: true });
  }

  async findOne(id: number): Promise<Department> {
    const d = await this.repo.findOne({ where: { id }, relations: ['institute'] });
    if (!d) throw new NotFoundException('Bölüm bulunamadı.');
    return d;
  }

  async create(dto: CreateDepartmentDto, createdBy?: number): Promise<Department> {
    let institute: Institute | undefined;
    if (dto.instituteId) {
      const inst = await this.instituteRepo.findOneBy({ id: dto.instituteId });
      if (!inst) throw new NotFoundException('Enstitü bulunamadı.');
      institute = inst;
    }

    return this.repo.save(
      this.repo.create({ name: dto.name, field: dto.field, institute, createdBy }),
    );
  }

  async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number): Promise<Department> {
    const dept = await this.findOne(id);

    if (dto.instituteId !== undefined) {
      if (!dto.instituteId) {
        dept.institute = undefined;
      } else {
        const inst = await this.instituteRepo.findOneBy({ id: dto.instituteId });
        if (!inst) throw new NotFoundException('Enstitü bulunamadı.');
        dept.institute = inst;
      }
    }

    if (dto.name !== undefined) dept.name = dto.name;
    if (dto.field !== undefined) dept.field = dto.field;
    dept.updatedAt = new Date();
    dept.updatedBy = updatedBy;
    return this.repo.save(dept);
  }

  async remove(id: number): Promise<{ message: string }> {
    const dept = await this.findOne(id);
    await this.repo.softRemove(dept);
    return { message: 'Anabilim dalı arşivlendi.' };
  }

  async restore(id: number): Promise<{ message: string }> {
    const dept = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!dept) throw new NotFoundException('Anabilim dalı bulunamadı.');
    if (!dept.deletedAt) throw new BadRequestException('Bu anabilim dalı arşivlenmemiş.');
    await this.repo.restore({ id });
    return { message: 'Anabilim dalı geri yüklendi.' };
  }
}
