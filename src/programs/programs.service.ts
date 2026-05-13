import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/common/constants/roles.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { Department } from 'src/departments/entities/department.entity';
import { Institute } from 'src/institute/entities/institute.entity';
import { User } from 'src/users/entities/user.entity';
import { ProgramCommissioner } from './entities/program-commissioner.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Institute)
    private readonly instituteRepository: Repository<Institute>,
    @InjectRepository(ProgramCommissioner)
    private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateProgramDto, admin: User | { sub?: number; id?: number }) {
    let department: Department | null = null;
    if (createDto.departmentId) {
      department = await this.departmentRepository.findOne({ where: { id: createDto.departmentId } });
      if (!department) throw new NotFoundException('Bölüm bulunamadı.');
    }

    let institute: Institute | null = null;
    if (createDto.instituteId) {
      institute = await this.instituteRepository.findOne({ where: { id: createDto.instituteId } });
      if (!institute) throw new NotFoundException('Enstitü bulunamadı.');
    }

    const actor = admin as any;
    const createdBy = { id: actor?.sub ?? actor?.id } as any;

    const program = this.programRepository.create({
      ...createDto,
      department: department ?? undefined,
      institute: institute ?? undefined,
      isActive: createDto.isActive ?? true,
      createdBy,
    });

    return this.programRepository.save(program);
  }

  async findAll(filters?: { departmentId?: number; instituteId?: number; degreeType?: string; isActive?: boolean }) {
    const qb = this.programRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.department', 'department')
      .leftJoinAndSelect('department.institute', 'dept_institute')
      .leftJoinAndSelect('p.institute', 'institute')
      .where('p.deleted_at IS NULL');

    if (filters?.departmentId) qb.andWhere('department.id = :departmentId', { departmentId: filters.departmentId });
    if (filters?.instituteId) qb.andWhere('institute.id = :instituteId', { instituteId: filters.instituteId });
    if (filters?.degreeType) qb.andWhere('p.degree_type = :degreeType', { degreeType: filters.degreeType });
    if (filters?.isActive !== undefined) qb.andWhere('p.is_active = :isActive', { isActive: filters.isActive });

    return qb.orderBy('p.name', 'ASC').getMany();
  }

  async findOne(id: number) {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['department', 'department.institute', 'institute'],
    });
    if (!program) throw new NotFoundException('Program bulunamadı.');
    return program;
  }

  async update(id: number, updateDto: UpdateProgramDto) {
    const program = await this.findOne(id);

    if (!updateDto || Object.keys(updateDto).length === 0) return program;

    if (updateDto.departmentId !== undefined) {
      if (!updateDto.departmentId) {
        program.department = undefined;
      } else {
        const dept = await this.departmentRepository.findOne({ where: { id: updateDto.departmentId } });
        if (!dept) throw new NotFoundException('Bölüm bulunamadı.');
        program.department = dept;
      }
      delete (updateDto as any).departmentId;
    }

    if (updateDto.instituteId !== undefined) {
      if (!updateDto.instituteId) {
        program.institute = undefined;
      } else {
        const inst = await this.instituteRepository.findOne({ where: { id: updateDto.instituteId } });
        if (!inst) throw new NotFoundException('Enstitü bulunamadı.');
        program.institute = inst;
      }
      delete (updateDto as any).instituteId;
    }

    Object.assign(program, updateDto);
    program.updatedAt = new Date();
    return this.programRepository.save(program);
  }

  async remove(id: number) {
    const program = await this.findOne(id);
    // Aktif (arşivlenmemiş) başvurusu olan program silinemez
    const activeApplications = await this.programRepository.manager
      .query(
        `SELECT COUNT(*) AS cnt FROM belek_graduate_admission.applications
         WHERE "programId" = $1 AND archived_at IS NULL`,
        [id],
      );
    const activeCount = parseInt(activeApplications?.[0]?.cnt ?? '0', 10);
    if (activeCount > 0) {
      throw new BadRequestException(
        `Bu programa ait ${activeCount} aktif başvuru bulunmaktadır. Program silinemez.`,
      );
    }
    await this.programRepository.softRemove(program);
    return { message: 'Program silindi.' };
  }

  async getQuotaStatus(programId: number): Promise<{ quota: number; accepted: number; available: number }> {
    const program = await this.findOne(programId);
    const accepted = await this.programRepository.manager
      .getRepository('belek_graduate_admission.applications')
      .createQueryBuilder('a')
      .where('a."programId" = :programId', { programId })
      .andWhere('a.status = :status', { status: 'accepted' })
      .andWhere('a.archived_at IS NULL')
      .getCount();
    return { quota: program.Quota, accepted, available: Math.max(0, program.Quota - accepted) };
  }

  async findMyPrograms(commissionerId: number) {
    const rows = await this.programCommissionerRepo.find({
      where: { commissioner: { id: commissionerId } } as any,
      relations: ['program', 'program.department', 'program.institute'],
    });
    return rows.map((r) => r.program);
  }

  async listCommissioners(programId: number) {
    await this.findOne(programId);
    const rows = await this.programCommissionerRepo.find({
      where: { program: { id: programId } } as any,
      relations: ['commissioner', 'commissioner.role'],
    });
    return rows.map((r) => ({
      id: r.commissioner.id,
      email: r.commissioner.email,
      firstName: r.commissioner.firstName,
      lastName: r.commissioner.lastName,
      role: (r.commissioner as any).role?.name ?? r.commissioner.userType,
    }));
  }

  async setCommissioners(programId: number, commissionerIds: number[]) {
    const program = await this.findOne(programId);
    const uniqueIds = Array.from(new Set((commissionerIds ?? []).map((x) => Number(x)).filter(Boolean)));
    if (uniqueIds.length === 0) throw new BadRequestException('En az 1 komisyon üyesi seçilmelidir.');

    const users = await this.userRepo.find({
      where: uniqueIds.map((id) => ({ id })) as any,
      relations: ['role'],
    });
    if (users.length !== uniqueIds.length) throw new BadRequestException('Komisyon üyesi kullanıcı(lar) bulunamadı.');

    const notCommissioners = users.filter((u: any) => (u.role?.name ?? u.userType) !== UserRole.KOMISYON_UYESI);
    if (notCommissioners.length > 0) throw new BadRequestException('Sadece "Komisyon Üyesi" rolündeki kullanıcılar atanabilir.');

    await this.programCommissionerRepo.delete({ program: { id: program.id } } as any);
    const rows = users.map((u) => this.programCommissionerRepo.create({ program, commissioner: u }));
    await this.programCommissionerRepo.save(rows);
    return { message: 'Komisyon üyeleri güncellendi.' };
  }
}
