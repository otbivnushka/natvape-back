import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Address } from '../../addresses/entities/address.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn()
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ length: 20 })
  status: string;

  @Column({ length: 20 })
  deliveryMethod: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comment: string | null;

  @Column({ nullable: true })
  addressId: number | null;

  @ManyToOne(() => Address)
  @JoinColumn()
  address: Address | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deliveryTime: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
