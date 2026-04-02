import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../../core/user/ports/user-repository';
import { User } from '../../../core/user/entity/user';
import { UserOrmEntity } from './user.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const orm = this.repo.create({
      id: user.id,
      username: user.username,
      email: user.email,
      hashedPassword: user.hashedPassword,
      permissions: user.permissions,
      subscriptionTier: user.subscriptionTier,
      remainingTrialMatches: user.remainingTrialMatches,
      generatedReferralCode: user.generatedReferralCode,
    });
    await this.repo.save(orm);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { username } });
    return orm ? this.toDomain(orm) : null;
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(): Promise<User[]> {
    const orms = await this.repo.find({ order: { createdAt: 'ASC' } });
    return orms.map((o) => this.toDomain(o));
  }

  async updatePermissions(
    id: string,
    permissions: number,
  ): Promise<User | null> {
    await this.repo.update({ id }, { permissions });
    return this.findById(id);
  }

  private toDomain(orm: UserOrmEntity): User {
    return new User(
      orm.id,
      orm.username,
      orm.email,
      orm.hashedPassword,
      orm.permissions,
      orm.subscriptionTier,
      orm.remainingTrialMatches,
      orm.generatedReferralCode,
    );
  }
}
