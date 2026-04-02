import { ChatMessage } from '../entity/chat-message';
import { ChatRepository } from '../ports/chat-repository';
import { IdGenerator } from '../../user/ports/id-generator';

export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    text: string,
    senderId: string,
    senderUsername: string,
  ): Promise<ChatMessage> {
    const id = this.idGenerator.generate();
    const chatMessage = new ChatMessage(
      id,
      text,
      senderId,
      senderUsername,
      new Date(),
    );
    await this.chatRepository.save(chatMessage);
    return chatMessage;
  }
}
