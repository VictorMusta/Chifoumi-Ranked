import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatOrmEntity } from './database/chat.entity';
import { TypeOrmChatRepository } from './database/typeorm-chat.repository';
import { ChatGateway } from './gateway/chat.gateway';
import { SendMessageUseCase } from '../../core/chat/useCase/send-message';
import { GetMessagesUseCase } from '../../core/chat/useCase/get-messages';
import { UuidGenerator } from '../users/adapter/uuidGenerator';
import { WsJwtAuthGuard } from '../auth/ws-jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ChatOrmEntity])],
  providers: [
    TypeOrmChatRepository,
    UuidGenerator,
    ChatGateway,
    WsJwtAuthGuard,
    {
      provide: SendMessageUseCase,
      useFactory: (repo: TypeOrmChatRepository, idGen: UuidGenerator) =>
        new SendMessageUseCase(repo, idGen),
      inject: [TypeOrmChatRepository, UuidGenerator],
    },
    {
      provide: GetMessagesUseCase,
      useFactory: (repo: TypeOrmChatRepository) => new GetMessagesUseCase(repo),
      inject: [TypeOrmChatRepository],
    },
  ],
})
export class ChatModule {}
