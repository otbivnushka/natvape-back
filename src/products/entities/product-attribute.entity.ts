import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { CategoryAttribute } from '../../categories/entities/category-attribute.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn()
  product: Product;

  @Column()
  attributeId: number;

  @ManyToOne(() => CategoryAttribute)
  @JoinColumn()
  attribute: CategoryAttribute;

  @Column({ length: 255 })
  value: string;
}
