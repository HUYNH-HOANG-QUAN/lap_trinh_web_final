import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";
import { Category } from "../entity/Category";
import { Product } from "../entity/Product";
import { ProductImage } from "../entity/ProductImage";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { productImageUpload, toPublicImageUrl } from "../config/upload";

/** Parse param thành số nguyên, trả về null nếu không hợp lệ */
function parseId(param: string | undefined): number | null {
  const n = parseInt(param ?? "", 10);
  return isNaN(n) || n <= 0 ? null : n;
}

// Users
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const keyword = (req.query.keyword as string | undefined)?.trim();
  const status = req.query.status as string | undefined;

  const qb = userRepo.createQueryBuilder("user").where("user.deletedAt IS NULL");

  if (keyword) {
    qb.andWhere(
      "(LOWER(user.fullName) LIKE LOWER(:kw) OR LOWER(user.email) LIKE LOWER(:kw) OR user.phone LIKE :kw)",
      { kw: `%${keyword}%` }
    );
  }
  if (status) {
    qb.andWhere("user.status = :status", { status });
  }

  const [users, totalElements] = await qb
    .orderBy("user.createdAt", "DESC")
    .skip(page * size)
    .take(size)
    .getManyAndCount();

  const totalPages = Math.ceil(totalElements / size);
  res.json({
    content: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
    })),
    totalElements,
    totalPages,
    size,
    number: page
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
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
    id: saved.id,
    fullName: saved.fullName,
    email: saved.email,
    phone: saved.phone,
    role: saved.role,
    status: saved.status,
  });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid user ID" }); return; }
  const user = await userRepo.findOne({ where: { id, deletedAt: null as any } });
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
    id: saved.id,
    fullName: saved.fullName,
    email: saved.email,
    phone: saved.phone,
    role: saved.role,
    status: saved.status,
  });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid user ID" }); return; }
  const user = await userRepo.findOne({ where: { id } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  user.deletedAt = new Date();
  await userRepo.save(user);
  res.status(204).send();
}

// Categories
export async function getAllCategoriesAdmin(req: Request, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const [categories, totalElements] = await categoryRepo
    .createQueryBuilder("c")
    .orderBy("c.createdAt", "ASC")
    .skip(page * size)
    .take(size)
    .getManyAndCount();

  const totalPages = Math.ceil(totalElements / size);
  res.json({
    content: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      isActive: c.isActive,
      createdAt: c.createdAt,
    })),
    totalElements,
    totalPages,
    size,
    number: page
  });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const { name, slug, parentId, isActive } = req.body;

  const category = new Category();
  category.name = name;
  category.slug = slug;
  category.parentId = parentId || undefined;
  category.isActive = isActive !== undefined ? isActive : true;

  const saved = await categoryRepo.save(category);
  res.status(201).json({
    id: saved.id,
    name: saved.name,
    slug: saved.slug,
    parentId: saved.parentId,
    isActive: saved.isActive,
    createdAt: saved.createdAt,
  });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid category ID" }); return; }
  const category = await categoryRepo.findOne({ where: { id } });
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
    id: saved.id,
    name: saved.name,
    slug: saved.slug,
    parentId: saved.parentId,
    isActive: saved.isActive,
    createdAt: saved.createdAt,
  });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository(Category);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid category ID" }); return; }
  const category = await categoryRepo.findOne({ where: { id } });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }
  category.deletedAt = new Date();
  category.isActive = false;
  await categoryRepo.save(category);
  res.status(204).send();
}

// Products
export async function getAllProductsAdmin(req: Request, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const keyword = (req.query.keyword as string | undefined)?.trim();
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
  const categoryId = req.query.categoryId !== undefined ? parseInt(req.query.categoryId as string) : undefined;

  const qb = productRepo
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "c")
    .where("p.deletedAt IS NULL");

  if (keyword) {
    qb.andWhere("(LOWER(p.name) LIKE LOWER(:kw) OR LOWER(p.sku) LIKE LOWER(:kw) OR LOWER(p.slug) LIKE LOWER(:kw))", { kw: `%${keyword}%` });
  }
  if (minPrice !== undefined && !isNaN(minPrice)) {
    qb.andWhere("p.price >= :minPrice", { minPrice });
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    qb.andWhere("p.price <= :maxPrice", { maxPrice });
  }
  if (categoryId !== undefined && !isNaN(categoryId)) {
    qb.andWhere("p.categoryId = :categoryId", { categoryId });
  }

  const [products, totalElements] = await qb
    .orderBy("p.createdAt", "DESC")
    .skip(page * size)
    .take(size)
    .getManyAndCount();

  // Lấy ảnh chính (isPrimary=true, hoặc sortOrder nhỏ nhất) cho từng sản phẩm
  const productIds = products.map((p) => p.id);
  const primaryImages = productIds.length
    ? await productImageRepo
        .createQueryBuilder("pi")
        .where("pi.productId IN (:...ids)", { ids: productIds })
        .orderBy("pi.isPrimary", "DESC")
        .addOrderBy("pi.sortOrder", "ASC")
        .addOrderBy("pi.id", "ASC")
        .getMany()
    : [];
  const imageByProductId = new Map<number, ProductImage>();
  for (const img of primaryImages) {
    if (!imageByProductId.has(img.productId)) {
      imageByProductId.set(img.productId, img);
    }
  }

  const totalPages = Math.ceil(totalElements / size);
  res.json({
    content: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      stockQuantity: p.stockQuantity,
      isActive: p.isActive,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      imageUrl: imageByProductId.get(p.id)?.imageUrl || null,
    })),
    totalElements,
    totalPages,
    size,
    number: page
  });
}

// Upload 1 ảnh sản phẩm – trả về URL public (/uploads/products/<file>)
export const uploadProductImageMiddleware = productImageUpload.single("image");

export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Không có file được upload." });
      return;
    }
    const imageUrl = toPublicImageUrl(req.file.filename);
    res.status(201).json({
      imageUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error("uploadProductImage error:", error);
    res.status(500).json({ message: error?.message || "Lỗi upload ảnh." });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const { sku, slug, name, shortDescription, description, price, oldPrice, stockQuantity, categoryId, isActive, imageUrl } = req.body;

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

  // Lưu ảnh sản phẩm (nếu có) vào bảng product_images
  let savedImageUrl: string | null = null;
  if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
    const img = new ProductImage();
    img.productId = saved.id;
    img.imageUrl = imageUrl.trim();
    img.sortOrder = 0;
    img.isPrimary = true;
    await productImageRepo.save(img);
    savedImageUrl = img.imageUrl;
  }

  res.status(201).json({
    id: saved.id,
    name: saved.name,
    sku: saved.sku,
    imageUrl: savedImageUrl,
  });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid product ID" }); return; }
  const product = await productRepo.findOne({ where: { id } });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  const { sku, slug, name, shortDescription, description, price, oldPrice, stockQuantity, categoryId, isActive, imageUrl } = req.body;
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

  // Cập nhật ảnh chính nếu imageUrl được gửi lên
  if (typeof imageUrl === "string") {
    const trimmed = imageUrl.trim();
    if (trimmed) {
      // Tìm ảnh chính hiện tại
      const existingPrimary = await productImageRepo
        .createQueryBuilder("pi")
        .where("pi.productId = :pid", { pid: id })
        .andWhere("pi.isPrimary = :primary", { primary: true })
        .getOne();

      if (existingPrimary) {
        if (existingPrimary.imageUrl !== trimmed) {
          existingPrimary.imageUrl = trimmed;
          await productImageRepo.save(existingPrimary);
        }
      } else {
        // Chưa có ảnh chính → tạo mới
        const img = new ProductImage();
        img.productId = id;
        img.imageUrl = trimmed;
        img.sortOrder = 0;
        img.isPrimary = true;
        await productImageRepo.save(img);
      }
    } else {
      // imageUrl rỗng → xóa ảnh chính hiện tại (nếu có) và file vật lý
      const existingPrimary = await productImageRepo
        .createQueryBuilder("pi")
        .where("pi.productId = :pid", { pid: id })
        .andWhere("pi.isPrimary = :primary", { primary: true })
        .getOne();
      if (existingPrimary) {
        await removeImageFile(existingPrimary.imageUrl);
        await productImageRepo.delete({ id: existingPrimary.id } as any);
      }
    }
  }

  res.json({ id: saved.id, name: saved.name });
}

// Xóa file ảnh vật lý (nếu thuộc /uploads/products)
function removeImageFile(imageUrl: string): void {
  try {
    if (!imageUrl) return;
    const prefix = "/uploads/products/";
    if (!imageUrl.startsWith(prefix)) return;
    const filename = imageUrl.substring(prefix.length);
    const filePath = path.join(__dirname, "..", "..", "uploads", "products", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn("Không thể xóa file ảnh:", e);
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ message: "Invalid product ID" }); return; }
  const product = await productRepo.findOne({ where: { id } });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  // Soft delete sản phẩm
  product.deletedAt = new Date();
  product.isActive = false;
  await productRepo.save(product);

  // Xóa các file ảnh vật lý (nếu có) - giữ lại record product_images để audit
  const images = await productImageRepo.find({ where: { productId: id } });
  for (const img of images) {
    removeImageFile(img.imageUrl);
  }

  res.status(204).send();
}

// Orders
export async function getAllOrdersAdmin(req: Request, res: Response): Promise<void> {
  const orderRepo = AppDataSource.getRepository(Order);
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const [orders, totalElements] = await orderRepo
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.user", "u")
    .leftJoinAndSelect("o.items", "i")
    .orderBy("o.createdAt", "DESC")
    .skip(page * size)
    .take(size)
    .getManyAndCount();

  const totalPages = Math.ceil(totalElements / size);
  res.json({
    content: orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      userId: o.userId,
      user: o.user ? {
        id: o.user.id,
        fullName: o.user.fullName,
        phone: o.user.phone
      } : null,
      username: o.user?.fullName || "Guest",
      total: o.totalAmount,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      recipientName: o.recipientName,
      recipientPhone: o.recipientPhone,
      shippingAddressLine1: o.shippingAddressLine1,
      shippingCity: o.shippingCity,
      shippingProvince: o.shippingProvince,
      items: (o.items || []).map((i: OrderItem) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productSku: i.productSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
    })),
    totalElements,
    totalPages,
    size,
    number: page
  });
}

export async function getOrderByIdAdmin(req: Request, res: Response): Promise<void> {
  const orderRepo = AppDataSource.getRepository(Order);
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const order = await orderRepo.findOne({
    where: { id },
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
    username: order.user?.fullName || "Guest",
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
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productSku: i.productSku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
  });
}
