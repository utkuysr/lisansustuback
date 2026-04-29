import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuth } from '../entities/user-auth.entity';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
    constructor(
        @InjectRepository(UserAuth)
        private readonly userAuthRepository: Repository<UserAuth>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId = req.user?.sub;
        if (!userId) return true;

        const userAuth = await this.userAuthRepository.findOneBy({ userId });
        if (userAuth?.mustChangePassword) {
            throw new ForbiddenException(
                'Şifrenizi değiştirmeniz gerekmektedir. Lütfen önce /auth/change-password adresini kullanın.',
            );
        }
        return true;
    }
}
