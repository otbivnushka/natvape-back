import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_colors')
export class ProductColor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.colors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  product: Product;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7 })
  hex: string;

  @Column()
  stock: number;
}
