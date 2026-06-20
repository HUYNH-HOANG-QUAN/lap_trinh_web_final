import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum OtpAction {
  REGISTER = "register",
  RESET_PASSWORD = "reset_password",
}

@Entity("otps")
export class Otp {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Index()
  @Column({ length: 150 })
  email!: string;

  @Column({ name: "otp_code", length: 10 })
  otpCode!: string;

  @Column({ type: "enum", enum: OtpAction })
  action!: OtpAction;

  @Column({ name: "expires_at" })
  expiresAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ name: "is_used", default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
