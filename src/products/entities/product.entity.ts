import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductColor } from './product-color.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn()
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice: number | null;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ length: 500 })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  badge: string | null;

  @Column({ length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  variantLabel: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductColor, (color) => color.product, { cascade: true })
  colors: ProductColor[];
}
