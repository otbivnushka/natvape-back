import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  filename: string;

  @Column({ length: 500 })
  originalName: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
