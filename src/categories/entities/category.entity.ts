import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  key: string;

  @Column({ length: 100 })
  label: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
