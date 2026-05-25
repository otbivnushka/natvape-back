import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('wishlist_items')
@Unique(['userId', 'productId'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.wishlistItems, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Product;
}
