import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('skins')
export class SkinOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  productId: string;

  @Column()
  priceId: string;

  @Column({ type: 'int' })
  price: number; // in cents

  @Column()
  color: string; // hex code

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
