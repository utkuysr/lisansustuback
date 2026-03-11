import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingEmail) {
      throw new BadRequestException("Bu Email Kullanılıyor.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.passwordHash, 10);

    // Get default role (student)
    let role;
    try {
      role = await this.rolesService.findByName('student');
    } catch {
      // If student role doesn't exist, get first role or use roleId from DTO
      if (createUserDto.roleId) {
        role = { id: createUserDto.roleId };
      } else {
        throw new BadRequestException("Default role 'student' not found");
      }
    }

    const user = this.userRepository.create({
      ...createUserDto,
      userType: createUserDto.userType || 'student',
      passwordHash: hashedPassword,
      isActive: true,
      isEmailVerified: false,
      createDate: new Date(),
      role: role,
    });
    return this.userRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: +id },
      relations: ['role']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role']
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // Hash password if provided
    if (updateUserDto.passwordHash) {
      updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.passwordHash, 10);
    }

    // Eğer roleId güncelleniyorsa, yeni role'ü fetch et
    if (updateUserDto.roleId) {
      const role = await this.rolesService.findOne(updateUserDto.roleId);
      user.role = role;
      // UpdateUserDto'dan roleId'yi kaldır (role object'i baştan set ettik)
      delete updateUserDto.roleId;
    }

    Object.assign(user, updateUserDto);
    user.updateDate = new Date();
    return this.userRepository.save(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.updateDate = new Date();
    await this.userRepository.save(user);
    return { message: 'Password reset successfully' };
  }

  async setVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    await this.userRepository.update(
      { email },
      {
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
      }
    );
  }

  async markEmailAsVerified(email: string): Promise<void> {
    await this.userRepository.update(
      { email },
      {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        verificationCode: undefined,
        verificationCodeExpiresAt: undefined,
      }
    );
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
