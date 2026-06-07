import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Category } from "./Category";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "category_id", nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: "category_id" })
  category?: Category;

  @Column({ unique: true, length: 50 })
  sku!: string;

  @Column({ unique: true, length: 150 })
  slug!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: "short_description", length: 500, nullable: true })
  shortDescription?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  price!: number;

  @Column({ name: "old_price", type: "decimal", precision: 15, scale: 2, nullable: true })
  oldPrice?: number;

  @Column({ name: "rating_avg", type: "decimal", precision: 3, scale: 2, default: 0 })
  ratingAvg!: number;

  @Column({ name: "rating_count", default: 0 })
  ratingCount!: number;

  @Column({ name: "stock_quantity", default: 0 })
  stockQuantity!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "deleted_at", nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
