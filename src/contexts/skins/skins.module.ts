import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkinOrmEntity } from './database/skin.entity';
import { TypeOrmSkinRepository } from './database/typeorm-skin.repository';
import { CreateSkinUseCase } from '../../core/skin/useCase/create-skin';
import { SkinController } from './api/skin.controller';
import { StripeModule } from '../stripe/stripe.module';
@Module({
  imports: [TypeOrmModule.forFeature([SkinOrmEntity]), StripeModule],
  controllers: [SkinController],
  providers: [TypeOrmSkinRepository, CreateSkinUseCase],
  exports: [TypeOrmSkinRepository],
})
export class SkinsModule {}
