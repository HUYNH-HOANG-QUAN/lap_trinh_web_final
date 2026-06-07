import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Product } from "./Product";

@Entity("product_images")
export class ProductImage {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "product_id" })
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "image_url", length: 500 })
  imageUrl!: string;

  @Column({ name: "sort_order", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_primary", default: false })
  isPrimary!: boolean;
}
