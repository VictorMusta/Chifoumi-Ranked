import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TypeOrmUserRepository } from '../users/database/typeorm-user.repository';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userRepo: TypeOrmUserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.userRepo.findById(userId);
    if (!user || user.permissions < 3) {
      throw new UnauthorizedException('Admin permissions required');
    }

    return true;
  }
}
