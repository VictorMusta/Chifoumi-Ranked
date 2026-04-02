import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './contexts/users/api/users.module';
import { RpsModule } from './contexts/rps/rps.module';
import { ChatModule } from './contexts/chat/chat.module';
import { UserOrmEntity } from './contexts/users/database/user.entity';
import { ChatOrmEntity } from './contexts/chat/database/chat.entity';
import {
  MatchStatsOrmEntity,
  UserRpsStatsOrmEntity,
} from './contexts/rps/database/match-stats.entity';
import { StripeModule } from './contexts/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities: [
          UserOrmEntity,
          ChatOrmEntity,
          MatchStatsOrmEntity,
          UserRpsStatsOrmEntity,
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    RpsModule,
    ChatModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
