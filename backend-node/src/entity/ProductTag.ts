import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("product_tags")
export class ProductTag {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ name: "display_name", length: 100 })
  displayName!: string;
}
