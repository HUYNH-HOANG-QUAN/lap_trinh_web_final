import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum Role {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  LOCKED = "LOCKED",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ name: "full_name", length: 100 })
  fullName!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ unique: true, length: 20, nullable: true })
  phone?: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash!: string;

  @Column({ type: "enum", enum: Role, default: Role.CUSTOMER })
  role!: Role;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ name: "email_verified_at", nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: "deleted_at", nullable: true })
  deletedAt?: Date;

  @Column({ name: "reset_token", length: 255, nullable: true })
  resetToken?: string;

  @Column({ name: "reset_token_expiry", nullable: true })
  resetTokenExpiry?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
