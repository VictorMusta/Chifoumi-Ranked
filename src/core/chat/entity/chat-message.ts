export class ChatMessage {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly senderId: string,
    public readonly senderUsername: string,
    public readonly createdAt: Date,
  ) {}
}
