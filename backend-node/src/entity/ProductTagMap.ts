import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Product } from "./Product";
import { ProductTag } from "./ProductTag";

@Entity("product_tag_map")
export class ProductTagMap {
  @PrimaryColumn({ name: "product_id" })
  productId!: number;

  @PrimaryColumn({ name: "tag_id" })
  tagId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @ManyToOne(() => ProductTag)
  @JoinColumn({ name: "tag_id" })
  tag!: ProductTag;
}
