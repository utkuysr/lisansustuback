import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstituteManager } from './entities/institute-manager.entity';
import { User } from 'src/users/entities/user.entity';
import { Institute } from 'src/institute/entities/institute.entity';
import { UserRole } from 'src/common/constants/roles.constants';

@Injectable()
export class InstituteManagersService {
  constructor(
    @InjectRepository(InstituteManager)
    private readonly repo: Repository<InstituteManager>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Institute)
    private readonly instituteRepo: Repository<Institute>,
  ) {}

  async create(userId: number, instituteId: number): Promise<InstituteManager> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (user.userType !== UserRole.INSTITUTE_MANAGER) {
      throw new BadRequestException('Bu kullanıcı enstitü yöneticisi rolüne sahip değil.');
    }

    const institute = await this.instituteRepo.findOneBy({ id: instituteId });
    if (!institute) throw new NotFoundException('Enstitü bulunamadı.');

    const existing = await this.repo.findOne({ where: { institute: { id: instituteId } } as any });
    if (existing) throw new BadRequestException('Bu enstitüye zaten bir yönetici atanmış.');

    const manager = this.repo.create({ user, institute });
    return this.repo.save(manager);
  }

  findAll(): Promise<InstituteManager[]> {
    return this.repo.find({ relations: ['user', 'institute'] });
  }

  async findMyProfile(userId: number): Promise<InstituteManager | null> {
    return this.repo.findOne({
      where: { user: { id: userId } } as any,
      relations: ['user', 'institute'],
    });
  }

  async remove(id: number): Promise<void> {
    const manager = await this.repo.findOneBy({ id });
    if (!manager) throw new NotFoundException('Atama bulunamadı.');
    await this.repo.remove(manager);
  }
}
