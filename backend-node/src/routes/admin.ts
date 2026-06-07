import { Response } from "express";
import { AppDataSource } from "../config/database";
import { User, Role, UserStatus } from "../entity/User";
import { Category } from "../entity/Category";
import { Product } from "../entity/Product";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { AuthRequest } from "../middleware/auth";
import bcryptjs from "bcryptjs";

function parseIntParam(val: string | undefined, fallback: number): number {
  const n = parseInt(val || "");
  return isNaN(n) ? fallback : n;
}

function parseSortDir(dir: string | undefined): "ASC" | "DESC" {
  return dir?.toUpperCase() === "DESC" ? "DESC" : "ASC";
}

// ============================================================
// USERS
// ============================================================
export async function getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  const page = parseIntParam(req.query.page as string, 1);
  const limit = parseIntParam(req.query.limit as string, 20);
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = parseSortDir(req.query.sortDir as string);
  const search = (req.query.search as string) || "";
  const roleFilter = req.query.role as string || "";
  const statusFilter = req.query.status as string || "";

  const validSortFields: Record<string, string> = {
    id: "user.id", fullName: "user.fullName", email: "user.email",
    createdAt: "user.createdAt", role: "user.role", status: "user.status",
  };
  const orderField = validSortFields[sortBy] || "user.createdAt";

  const qb = AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.deletedAt IS NULL");

  if (search) {
    qb.andWhere(
      "(user.fullName LIKE :search OR user.email LIKE :search OR user.phone LIKE :search)",
      { search: `%${search}%` }
    );
  }
  if (roleFilter) qb.andWhere("user.role = :role", { role: roleFilter });
  if (statusFilter) qb.andWhere("user.status = :status", { status: statusFilter });

  const total = await qb.clone().getCount();
  const users = await qb
    .orderBy(orderField, sortDir)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  res.json({
    data: users.map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email, phone: u.phone,
      role: u.role, status: u.status, createdAt: u.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const { fullName, email, phone, role, status, passwordHash } = req.body;

  if (!fullName?.trim() || !email?.trim()) {
    res.status(400).json({ message: "Full name and email are required" });
    return;
  }

  const user = new User();
  user.fullName = fullName.trim();
  user.email = email.trim();
  user.phone = phone?.trim() || undefined;
  user.role = role || "CUSTOMER";
  user.status = status || "ACTIVE";
  user.passwordHash = passwordHash
    ? await bcryptjs.hash(passwordHash, 10)
    : await bcryptjs.hash("Password@123", 10);

  const saved = await userRepo.save(user);
  res.status(201).json({
    id: saved.id, fullName: saved.fullName, email: saved.email,
    phone: saved.phone, role: saved.role, status: saved.status,
  });
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: parseInt(req.params.id), deletedAt: null as any } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { fullName, email, phone, role, status, passwordHash } = req.body;
  if (fullName?.trim()) user.fullName = fullName.trim();
  if (email?.trim()) user.email = email.trim();
  if (phone !== undefined) user.phone = phone?.trim() || undefined;
  if (role) user.role = role;
  if (status) user.status = status;
  if (passwordHash?.trim()) user.passwordHash = await bcryptjs.hash(passwordHash, 10);

  const saved = await userRepo.save(user);
  res.json({
    id: saved.id, fullName: saved.fullName, email: saved.email,
    phone: saved.phone, role: saved.role, status: saved.status,
  });
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  user.deletedAt = new Date();
  await userRepo.save(user);
  res.status(204).send();
}

// ============================================================
// CATEGORIES
// ============================================================
export async function getAllCategoriesAdmin(req: AuthRequest, res: Response): Promise<void> {
  const page = parseIntParam(req.query.page as string, 1);
  const limit = parseIntParam(req.query.limit as string, 20);
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = parseSortDir(req.query.sortDir as string);
  const search = (req.query.search as string) || "";

  const validSortFields: Record<string, string> = {
    id: "c.id", name: "c.name", slug: "c.slug",
    createdAt: "c.createdAt", isActive: "c.isActive",
  };
  const orderField = validSortFields[sortBy] || "c.createdAt";

  const qb = AppDataSource.getRepository(Category)
    .createQueryBuilder("c")
    .where("c.deletedAt IS NULL");

  if (search) qb.andWhere("c.name LIKE :search", { search: `%${search}%` });

  const total = await qb.clone().getCount();
  const categories = await qb
    .orderBy(orderField, sortDir)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  res.json({
    data: categories.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      parentId: c.parentId, isActive: c.isActive, createdAt: c.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { name, slug, parentId, isActive } = req.body;

  const category = new Category();
  category.name = name;
  category.slug = slug;
  category.parentId = parentId || undefined;
  category.isActive = isActive !== undefined ? isActive : true;

  const saved = await categoryRepo.save(category);
  res.status(201).json({
    id: saved.id, name: saved.name, slug: saved.slug,
    parentId: saved.parentId, isActive: saved.isActive, createdAt: saved.createdAt,
  });
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const category = await categoryRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  const { name, slug, parentId, isActive } = req.body;
  if (name) category.name = name;
  if (slug) category.slug = slug;
  if (parentId !== undefined) category.parentId = parentId || undefined;
  if (isActive !== undefined) category.isActive = isActive;

  const saved = await categoryRepo.save(category);
  res.json({
    id: saved.id, name: saved.name, slug: saved.slug,
    parentId: saved.parentId, isActive: saved.isActive, createdAt: saved.createdAt,
  });
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const category = await categoryRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }
  category.deletedAt = new Date();
  category.isActive = false;
  await categoryRepo.save(category);
  res.status(204).send();
}

// ============================================================
// PRODUCTS
// ============================================================
export async function getAllProductsAdmin(req: AuthRequest, res: Response): Promise<void> {
  const page = parseIntParam(req.query.page as string, 1);
  const limit = parseIntParam(req.query.limit as string, 20);
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = parseSortDir(req.query.sortDir as string);
  const search = (req.query.search as string) || "";
  const categoryId = req.query.categoryId as string || "";
  const stockFilter = req.query.stockFilter as string || ""; // "low" | "ok"

  const validSortFields: Record<string, string> = {
    id: "p.id", name: "p.name", sku: "p.sku",
    price: "p.price", stockQuantity: "p.stockQuantity",
    ratingAvg: "p.ratingAvg", createdAt: "p.createdAt", isActive: "p.isActive",
  };
  const orderField = validSortFields[sortBy] || "p.createdAt";

  const qb = AppDataSource.getRepository(Product)
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "c")
    .where("p.deletedAt IS NULL");

  if (search) {
    qb.andWhere("(p.name LIKE :search OR p.sku LIKE :search)", { search: `%${search}%` });
  }
  if (categoryId) qb.andWhere("p.categoryId = :catId", { catId: parseInt(categoryId) });
  if (stockFilter === "low") qb.andWhere("p.stockQuantity < 50");
  if (stockFilter === "ok") qb.andWhere("p.stockQuantity >= 50");

  const total = await qb.clone().getCount();
  const products = await qb
    .orderBy(orderField, sortDir)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  res.json({
    data: products.map((p) => ({
      id: p.id, sku: p.sku, slug: p.slug, name: p.name,
      shortDescription: p.shortDescription, description: p.description,
      price: p.price, oldPrice: p.oldPrice,
      ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
      stockQuantity: p.stockQuantity, isActive: p.isActive,
      categoryId: p.categoryId, categoryName: p.category?.name || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const { sku, slug, name, shortDescription, description, price, oldPrice, stockQuantity, categoryId, isActive } = req.body;

  const product = new Product();
  product.sku = sku;
  product.slug = slug;
  product.name = name;
  product.shortDescription = shortDescription || "";
  product.description = description || "";
  product.price = price;
  product.oldPrice = oldPrice || null;
  product.stockQuantity = stockQuantity ?? 0;
  product.categoryId = categoryId || undefined;
  product.isActive = isActive !== undefined ? isActive : true;
  product.ratingAvg = 0;
  product.ratingCount = 0;

  const saved = await productRepo.save(product);
  res.status(201).json({ id: saved.id, name: saved.name, sku: saved.sku });
}

export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  const { sku, slug, name, shortDescription, description, price, oldPrice, stockQuantity, categoryId, isActive } = req.body;
  if (sku) product.sku = sku;
  if (slug) product.slug = slug;
  if (name) product.name = name;
  if (shortDescription !== undefined) product.shortDescription = shortDescription;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (oldPrice !== undefined) product.oldPrice = oldPrice;
  if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
  if (categoryId !== undefined) product.categoryId = categoryId || undefined;
  if (isActive !== undefined) product.isActive = isActive;

  const saved = await productRepo.save(product);
  res.json({ id: saved.id, name: saved.name });
}

export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  product.deletedAt = new Date();
  product.isActive = false;
  await productRepo.save(product);
  res.status(204).send();
}

// ============================================================
// ORDERS
// ============================================================
export async function getAllOrdersAdmin(req: AuthRequest, res: Response): Promise<void> {
  const page = parseIntParam(req.query.page as string, 1);
  const limit = parseIntParam(req.query.limit as string, 20);
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = parseSortDir(req.query.sortDir as string);
  const search = (req.query.search as string) || "";
  const statusFilter = req.query.status as string || "";

  const validSortFields: Record<string, string> = {
    id: "o.id", orderCode: "o.orderCode", createdAt: "o.createdAt",
    placedAt: "o.placedAt", totalAmount: "o.totalAmount",
    status: "o.status", paymentStatus: "o.paymentStatus",
  };
  const orderField = validSortFields[sortBy] || "o.createdAt";

  const qb = AppDataSource.getRepository(Order)
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.user", "u")
    .leftJoinAndSelect("o.items", "i");

  if (search) {
    qb.andWhere(
      "(o.orderCode LIKE :search OR o.recipientName LIKE :search OR u.fullName LIKE :search)",
      { search: `%${search}%` }
    );
  }
  if (statusFilter) qb.andWhere("o.status = :status", { status: statusFilter });

  const total = await qb.clone().getCount();
  const orders = await qb
    .orderBy(orderField, sortDir)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  res.json({
    data: orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      userId: o.userId,
      userName: o.user?.fullName || "Guest",
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      placedAt: o.placedAt,
      recipientName: o.recipientName,
      recipientPhone: o.recipientPhone,
      shippingAddressLine1: o.shippingAddressLine1,
      shippingCity: o.shippingCity,
      shippingProvince: o.shippingProvince,
      items: o.items.map((i: OrderItem) => ({
        id: i.id, productId: i.productId, productName: i.productName,
        productSku: i.productSku, quantity: i.quantity,
        unitPrice: i.unitPrice, lineTotal: i.lineTotal,
      })),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getOrderByIdAdmin(req: AuthRequest, res: Response): Promise<void> {
  const orderRepo = AppDataSource.getRepository(Order);
  const order = await orderRepo.findOne({
    where: { id: parseInt(req.params.id) },
    relations: ["user", "items"],
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({
    id: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    userName: order.user?.fullName || "Guest",
    subtotal: order.subtotal,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    shippingAddressLine1: order.shippingAddressLine1,
    shippingCity: order.shippingCity,
    shippingProvince: order.shippingProvince,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    createdAt: order.createdAt,
    placedAt: order.placedAt,
    items: order.items.map((i: OrderItem) => ({
      id: i.id, productId: i.productId, productName: i.productName,
      productSku: i.productSku, quantity: i.quantity,
      unitPrice: i.unitPrice, lineTotal: i.lineTotal,
    })),
  });
}

// ============================================================
// ADMIN ACCOUNTS (accounts with role = ADMIN, using User table)
// ============================================================
export async function getAllAdminAccounts(req: AuthRequest, res: Response): Promise<void> {
  const page = parseIntParam(req.query.page as string, 1);
  const limit = parseIntParam(req.query.limit as string, 20);
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortDir = parseSortDir(req.query.sortDir as string);
  const search = (req.query.search as string) || "";

  const validSortFields: Record<string, string> = {
    id: "user.id", fullName: "user.fullName", email: "user.email",
    createdAt: "user.createdAt", status: "user.status",
  };
  const orderField = validSortFields[sortBy] || "user.createdAt";

  const qb = AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.deletedAt IS NULL")
    .andWhere("user.role = :role", { role: "ADMIN" });

  if (search) {
    qb.andWhere(
      "(user.fullName LIKE :search OR user.email LIKE :search OR user.phone LIKE :search)",
      { search: `%${search}%` }
    );
  }

  const total = await qb.clone().getCount();
  const admins = await qb
    .orderBy(orderField, sortDir)
    .skip((page - 1) * limit)
    .take(limit)
    .getMany();

  res.json({
    data: admins.map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email,
      phone: u.phone, status: u.status, createdAt: u.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createAdminAccount(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const { fullName, email, phone, passwordHash, status } = req.body;

  if (!fullName?.trim() || !email?.trim()) {
    res.status(400).json({ message: "Full name and email are required" });
    return;
  }
  if (!passwordHash?.trim()) {
    res.status(400).json({ message: "Password is required for admin accounts" });
    return;
  }

  const existing = await userRepo.findOne({ where: { email: email.trim() } });
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const user = new User();
  user.fullName = fullName.trim();
  user.email = email.trim();
  user.phone = phone?.trim() || undefined;
  user.role = Role.ADMIN;
  user.status = status || UserStatus.ACTIVE;
  user.passwordHash = await bcryptjs.hash(passwordHash, 10);

  const saved = await userRepo.save(user);
  res.status(201).json({
    id: saved.id, fullName: saved.fullName, email: saved.email,
    phone: saved.phone, role: saved.role, status: saved.status,
  });
}

export async function updateAdminAccount(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: parseInt(req.params.id), deletedAt: null as any } });
  if (!user) {
    res.status(404).json({ message: "Admin account not found" });
    return;
  }
  if (user.role !== "ADMIN") {
    res.status(403).json({ message: "Not an valid admin account" });
    return;
  }

  const { fullName, email, phone, status, passwordHash } = req.body;
  if (fullName?.trim()) user.fullName = fullName.trim();
  if (email?.trim()) user.email = email.trim();
  if (phone !== undefined) user.phone = phone?.trim() || undefined;
  if (status) user.status = status;
  if (passwordHash?.trim()) user.passwordHash = await bcryptjs.hash(passwordHash, 10);

  const saved = await userRepo.save(user);
  res.json({
    id: saved.id, fullName: saved.fullName, email: saved.email,
    phone: saved.phone, role: saved.role, status: saved.status,
  });
}

export async function deleteAdminAccount(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: parseInt(req.params.id) } });
  if (!user) {
    res.status(404).json({ message: "Admin account not found" });
    return;
  }
  if (user.role !== "ADMIN") {
    res.status(403).json({ message: "Not an admin account" });
    return;
  }
  user.deletedAt = new Date();
  await userRepo.save(user);
  res.status(204).send();
}

export async function changeAdminPassword(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: parseInt(req.params.id), deletedAt: null as any } });
  if (!user) {
    res.status(404).json({ message: "Admin account not found" });
    return;
  }
  if (user.role !== "ADMIN") {
    res.status(403).json({ message: "Not an admin account" });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword?.trim() || !newPassword?.trim()) {
    res.status(400).json({ message: "Current password and new password are required" });
    return;
  }

  const valid = await bcryptjs.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(403).json({ message: "Current password is incorrect" });
    return;
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 10);
  await userRepo.save(user);
  res.json({ message: "Password updated successfully" });
}
