import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "src/common/constants/roles.constants";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Program } from "./entities/program.entity";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { Faculty } from "src/faculties/entities/faculty.entity";
import { User } from "src/users/entities/user.entity";
import { ProgramCommissioner } from "./entities/program-commissioner.entity";

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Faculty)
    private readonly facultyRepository: Repository<Faculty>,
    @InjectRepository(ProgramCommissioner)
    private readonly programCommissionerRepo: Repository<ProgramCommissioner>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createDto: CreateProgramDto, admin: User | { sub?: number; id?: number }) {
    let faculty: Faculty | null = null;
    if (createDto.facultyId) {
      faculty = await this.facultyRepository.findOne({ where: { id: createDto.facultyId } });
      if (!faculty) throw new NotFoundException("Fakülte bulunamadı.");
    }

    const actor = admin as any;
    const createdBy = { id: actor?.sub ?? actor?.id } as any;

    const program = this.programRepository.create({
      ...createDto,
      faculty: faculty ?? undefined,
      createdBy,
    });

    return this.programRepository.save(program);
  }

  async findAll() {
    return this.programRepository.find({ relations: ["faculty"] });
  }

  async findOne(id: number) {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ["faculty"],
    });
    if (!program) throw new NotFoundException("Program bulunamadı.");
    return program;
  }

  async update(id: number, updateDto: UpdateProgramDto) {
    const program = await this.findOne(id);

    if (!updateDto || Object.keys(updateDto).length === 0) {
      return program;
    }

    if (updateDto.facultyId) {
      const faculty = await this.facultyRepository.findOne({ where: { id: updateDto.facultyId } });
      if (!faculty) throw new NotFoundException("Fakülte bulunamadı.");
      program.faculty = faculty;
    }

    Object.assign(program, updateDto);
    return this.programRepository.save(program);
  }

  async remove(id: number) {
    const program = await this.findOne(id);
    return this.programRepository.remove(program);
  }

  async findMyPrograms(commissionerId: number) {
    const rows = await this.programCommissionerRepo.find({
      where: { commissioner: { id: commissionerId } } as any,
      relations: ['program', 'program.faculty'],
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
    if (uniqueIds.length === 0) {
      throw new BadRequestException('En az 1 komisyon üyesi seçilmelidir.');
    }

    const users = await this.userRepo.find({
      where: uniqueIds.map((id) => ({ id })) as any,
      relations: ['role'],
    });
    if (users.length !== uniqueIds.length) {
      throw new BadRequestException('Komisyon üyesi kullanıcı(lar) bulunamadı.');
    }

    const notCommissioners = users.filter((u: any) => (u.role?.name ?? u.userType) !== UserRole.KOMISYON_UYESI);
    if (notCommissioners.length > 0) {
      throw new BadRequestException('Sadece "Komisyon Üyesi" rolündeki kullanıcılar atanabilir.');
    }

    await this.programCommissionerRepo.delete({ program: { id: program.id } } as any);
    const rows = users.map((u) => this.programCommissionerRepo.create({ program, commissioner: u }));
    await this.programCommissionerRepo.save(rows);
    return { message: 'Komisyon üyeleri güncellendi.' };
  }
}
