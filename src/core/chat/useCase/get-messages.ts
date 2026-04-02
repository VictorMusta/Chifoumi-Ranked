import { ChatMessage } from '../entity/chat-message';
import { ChatRepository } from '../ports/chat-repository';

export class GetMessagesUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(limit: number = 50): Promise<ChatMessage[]> {
    return this.chatRepository.findLatest(limit);
  }
}
