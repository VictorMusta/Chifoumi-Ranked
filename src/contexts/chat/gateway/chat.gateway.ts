import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SendMessageUseCase } from '../../../core/chat/useCase/send-message';
import { GetMessagesUseCase } from '../../../core/chat/useCase/get-messages';
import { WsJwtAuthGuard } from '../../auth/ws-jwt.guard'; // À créer

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
  ) {}

  async handleConnection(client: Socket) {
    console.log('[ChatGateway] Client connected:', client.id);
    const messages = await this.getMessagesUseCase.execute();
    client.emit('history', messages);
    console.log(
      `[ChatGateway] Sent ${messages.length} messages to ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtAuthGuard) // Seulement pour les envoyeurs
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: any,
    @MessageBody() data: { text: string },
  ) {
    console.log(
      'Message received in Gateway:',
      data.text,
      'from user:',
      client.user?.username,
    );
    const user = client.user;
    const userId = user.id || user.sub;
    const message = await this.sendMessageUseCase.execute(
      data.text,
      userId,
      user.username,
    );

    console.log('Message saved and broadcasting:', message.id);
    // Diffuser le message final et coloré à TOUTE la namespace chat
    this.server.emit('message', message);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: any,
    @MessageBody() data: { text: string },
  ) {
    const user = client.user;
    if (!user) return;

    const userId = user.id || user.sub || 'guest';
    client.broadcast.emit('userTyping', {
      senderId: userId,
      senderUsername: user.username,
      text: data.text,
    });
  }
}
