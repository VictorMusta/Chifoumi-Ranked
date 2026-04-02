import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from '../users/api/users.module';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
