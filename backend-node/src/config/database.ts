import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Product } from "../entity/Product";
import { Category } from "../entity/Category";
import { ProductImage } from "../entity/ProductImage";
import { ProductTag } from "../entity/ProductTag";
import { ProductTagMap } from "../entity/ProductTagMap";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { Review } from "../entity/Review";
import { Message } from "../entity/Message";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ProFitSuppsDB",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  charset: "utf8mb4",
  extra: {
    charset: "utf8mb4",
  },
  entities: [
    User,
    Product,
    Category,
    ProductImage,
    ProductTag,
    ProductTagMap,
    Order,
    OrderItem,
    Review,
    Message,
  ],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("[DB] Database connection established");
  } catch (error) {
    console.error("[DB] Failed to connect to database:", error);
    throw error;
  }
}
