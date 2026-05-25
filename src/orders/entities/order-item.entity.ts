import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;

  @Column()
  productId: number;

  @Column({ length: 200 })
  productName: string;

  @Column({ length: 500 })
  productImage: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  variantKey: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  variantName: string | null;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
}
