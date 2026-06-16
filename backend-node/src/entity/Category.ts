import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "parent_id", nullable: true })
  parentId?: number;

  @ManyToOne(() => Category, (cat) => cat.children, { nullable: true })
  @JoinColumn({ name: "parent_id" })
  parent?: Category;

  @OneToMany(() => Category, (cat) => cat.parent)
  children?: Category[];

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  slug!: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "deleted_at", nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
