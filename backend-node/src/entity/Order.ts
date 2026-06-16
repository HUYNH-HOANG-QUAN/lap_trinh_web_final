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
import { User } from "./User";
import { OrderItem } from "./OrderItem";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "user_id", nullable: true })
  userId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @Column({ name: "order_code", unique: true, length: 50 })
  orderCode!: string;

  @Column({ name: "recipient_name", length: 100 })
  recipientName!: string;

  @Column({ name: "recipient_phone", length: 20 })
  recipientPhone!: string;

  @Column({ name: "shipping_address_line1", length: 255 })
  shippingAddressLine1!: string;

  @Column({ name: "shipping_address_line2", length: 255, nullable: true })
  shippingAddressLine2?: string;

  @Column({ name: "shipping_city", length: 100 })
  shippingCity!: string;

  @Column({ name: "shipping_province", length: 100 })
  shippingProvince!: string;

  @Column({ name: "shipping_country", length: 100, default: "Vietnam" })
  shippingCountry!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ name: "discount_amount", type: "decimal", precision: 15, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ name: "shipping_fee", type: "decimal", precision: 15, scale: 2, default: 0 })
  shippingFee!: number;

  @Column({ name: "total_amount", type: "decimal", precision: 15, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ length: 20, default: "PENDING" })
  status!: string;

  @Column({ name: "payment_status", length: 20, default: "UNPAID" })
  paymentStatus!: string;

  @Column({ name: "payment_attempts", default: 0 })
  paymentAttempts!: number;

  @Column({ name: "bank_transfer_slip", length: 500, nullable: true })
  bankTransferSlip?: string;

  @Column({ name: "paid_at", nullable: true })
  paidAt?: Date;

  @Column({ name: "delivered_at", nullable: true })
  deliveredAt?: Date;

  @Column({ name: "completed_at", nullable: true })
  completedAt?: Date;

  @Column({ length: 500, nullable: true })
  note?: string;

  @Column({ name: "placed_at" })
  placedAt!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
