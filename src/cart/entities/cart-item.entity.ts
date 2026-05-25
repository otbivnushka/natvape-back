import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
@Unique(['userId', 'productId', 'variantKey'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Product;

  @Column()
  quantity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  variantKey: string | null;
}
