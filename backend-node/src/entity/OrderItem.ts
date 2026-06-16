import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "order_id" })
  orderId!: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "product_id" })
  productId!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "product_name", length: 200 })
  productName!: string;

  @Column({ name: "product_sku", length: 50 })
  productSku!: string;

  @Column()
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 15, scale: 2 })
  unitPrice!: number;

  @Column({ name: "line_total", type: "decimal", precision: 15, scale: 2, default: 0 })
  lineTotal!: number;
}
