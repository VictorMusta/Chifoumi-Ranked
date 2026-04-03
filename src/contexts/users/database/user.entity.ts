import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  hashedPassword: string;

  @Column({ type: 'int', default: 0 })
  permissions: number;

  @Column({ type: 'int', default: 0 })
  subscriptionTier: number; // 0: FREE, 1: BASIC, 2: PRO

  @Column({ type: 'int', default: 5 })
  remainingTrialMatches: number;

  @Column({ type: 'varchar', nullable: true, unique: true })
  generatedReferralCode: string | null;

  @Column({ type: 'simple-array', default: '' })
  ownedSkinIds: string[];

  @Column({ type: 'varchar', nullable: true })
  activeSkinId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
