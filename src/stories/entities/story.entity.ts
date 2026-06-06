import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Image } from '../../images/entities/image.entity';
import { StorySet } from './story-set.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Image, { onDelete: 'SET NULL' })
  @JoinColumn()
  image: Image | null;

  @Column({ type: 'int', default: 3000 })
  duration: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column()
  storySetId: number;

  @ManyToOne(() => StorySet, (s) => s.stories, { onDelete: 'CASCADE' })
  @JoinColumn()
  storySet: StorySet;

  @CreateDateColumn()
  createdAt: Date;
}
