import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('rates')
@Unique(['userId', 'productId'])
export class Rate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column({ type: 'int' })
  value: number;

  @CreateDateColumn()
  createdAt: Date;
}
