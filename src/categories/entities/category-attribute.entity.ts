import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('category_attributes')
export class CategoryAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn()
  category: Category;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  key: string;

  @Column({ length: 20 })
  type: string;

  @Column({ default: false })
  required: boolean;
}
