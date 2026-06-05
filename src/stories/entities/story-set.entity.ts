import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Image } from '../../images/entities/image.entity';
import { Story } from './story.entity';

@Entity('story_sets')
export class StorySet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @ManyToOne(() => Image, { onDelete: 'SET NULL' })
  @JoinColumn()
  image: Image | null;

  @OneToMany(() => Story, (s) => s.storySet, { cascade: true })
  stories: Story[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
