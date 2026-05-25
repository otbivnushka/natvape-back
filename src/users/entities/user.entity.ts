import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { WishlistItem } from '../../wishlist/entities/wishlist-item.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CartItem, (item) => item.user)
  cartItems: CartItem[];

  @OneToMany(() => WishlistItem, (item) => item.user)
  wishlistItems: WishlistItem[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
