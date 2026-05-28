import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAuth } from 'src/auth/entities/user-auth.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { RolesService } from 'src/roles/roles.service';
import { validatePasswordPolicy } from 'src/auth/utils/password-policy';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private readonly userAuthRepository: Repository<UserAuth>,
    private readonly rolesService: RolesService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    options?: { allowRoleOverride?: boolean; createdById?: number },
  ): Promise<User> {
    const existingEmail = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingEmail) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanılıyor.');
    }

    const policy = validatePasswordPolicy(createUserDto.password);
    if (!policy.ok) {
      throw new BadRequestException(policy.message);
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    let role = await this.rolesService.findByName('student');
    if (options?.allowRoleOverride && createUserDto.roleId) {
      role = await this.rolesService.findOne(createUserDto.roleId);
    }

    const newUser = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      userType: role.name,
      isActive: true,
      // Admin tarafından oluşturulan hesaplar otomatik doğrulanmış sayılır
      isEmailVerified: !!options?.createdById,
      emailVerifiedAt: options?.createdById ? new Date() : null,
      role,
      faculty: createUserDto.faculty,
      department: createUserDto.department,
      createdBy: options?.createdById ?? null,
    } as any);

    const saved = await this.userRepository.save(newUser) as unknown as User;

    await this.userAuthRepository.save(
      this.userAuthRepository.create({
        userId: saved.id,
        passwordHash: hashedPassword,
        mustChangePassword: false,
        isStaff: false,
        isSuperuser: false,
        createdAt: new Date(),
      }),
    );

    return this.findOne(String(saved.id));
  }

  findAll(withArchived = false): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'], withDeleted: withArchived });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: +id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('Bu e-posta adresine ait kullanıcı bulunamadı.');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      const policy = validatePasswordPolicy(updateUserDto.password);
      if (!policy.ok) {
        throw new BadRequestException(policy.message);
      }
      (updateUserDto as any).passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    if (updateUserDto.roleId) {
      const role = await this.rolesService.findOne(updateUserDto.roleId);
      user.role = role;
      delete updateUserDto.roleId;
      await this.userRepository.update({ id: user.id }, { userType: role.name });
      user.userType = role.name;
    }

    Object.assign(user, updateUserDto);
    user.updateDate = new Date();
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async updatePasswordHash(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update({ id: +id }, { passwordHash: hashedPassword, updateDate: new Date() });
    await this.userAuthRepository.update({ userId: +id }, { passwordHash: hashedPassword });
  }

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.ok) {
      throw new BadRequestException(policy.message);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.updatePasswordHash(id, hashedPassword);
    return { message: 'Şifre başarıyla sıfırlandı.' };
  }

  async setVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    const user = await this.findByEmail(email);
    await this.userAuthRepository.update(
      { userId: user.id },
      {
        passwordResetToken: code,
        passwordResetExpires: expiresAt,
        updatedAt: new Date(),
      },
    );
  }

  async findUserAuthByEmail(email: string): Promise<UserAuth | null> {
    const user = await this.findByEmail(email);
    return this.userAuthRepository.findOneBy({ userId: user.id });
  }

  async markEmailAsVerified(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    await this.userRepository.update(
      { email },
      {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    );
    await this.userAuthRepository.update(
      { userId: user.id },
      {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        updatedAt: new Date(),
      },
    );
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.softDelete({ id: +id });
  }

  async restore(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: +id }, withDeleted: true });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (!user.deletedAt) throw new BadRequestException('Bu kullanıcı arşivlenmemiş.');
    await this.userRepository.restore({ id: +id });
  }
}
