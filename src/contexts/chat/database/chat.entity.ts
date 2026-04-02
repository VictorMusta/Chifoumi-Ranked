import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @Column('uuid')
  senderId: string;

  @Column()
  senderUsername: string;

  @CreateDateColumn()
  createdAt: Date;
}
