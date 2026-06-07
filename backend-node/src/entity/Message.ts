import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ length: 255 })
  subject!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ length: 20, default: "UNREAD" })
  status!: string;

  @Column({ name: "reply_content", type: "text", nullable: true })
  replyContent?: string;

  @Column({ name: "replied_at", nullable: true })
  repliedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
