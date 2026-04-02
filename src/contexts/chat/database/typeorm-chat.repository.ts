import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRepository } from '../../../core/chat/ports/chat-repository';
import { ChatMessage } from '../../../core/chat/entity/chat-message';
import { ChatOrmEntity } from './chat.entity';

@Injectable()
export class TypeOrmChatRepository implements ChatRepository {
  constructor(
    @InjectRepository(ChatOrmEntity)
    private readonly ormRepository: Repository<ChatOrmEntity>,
  ) {}

  async save(message: ChatMessage): Promise<void> {
    const ormEntity = this.ormRepository.create({
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      senderUsername: message.senderUsername,
      createdAt: message.createdAt,
    });
    await this.ormRepository.save(ormEntity);
  }

  async findLatest(limit: number): Promise<ChatMessage[]> {
    const entities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return entities
      .map(
        (e) =>
          new ChatMessage(e.id, e.text, e.senderId, e.senderUsername, e.createdAt),
      )
      .reverse(); // Inverse chronologique pour l'affichage
  }
}
