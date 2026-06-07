import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Product } from "./Product";
import { User } from "./User";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "product_id" })
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  rating!: number;

  @Column({ length: 1000, nullable: true })
  comment?: string;

  @Column({ name: "is_verified_purchase", default: false })
  isVerifiedPurchase!: boolean;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
