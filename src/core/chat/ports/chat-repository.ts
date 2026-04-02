import { ChatMessage } from '../entity/chat-message';

export interface ChatRepository {
  save(message: ChatMessage): Promise<void>;
  findLatest(limit: number): Promise<ChatMessage[]>;
}
