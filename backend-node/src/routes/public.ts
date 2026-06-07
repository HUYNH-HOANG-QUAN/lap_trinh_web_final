import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Product } from "../entity/Product";
import { ProductImage } from "../entity/ProductImage";
import { ProductTagMap } from "../entity/ProductTagMap";
import { ProductTag } from "../entity/ProductTag";

export async function getProducts(req: Request, res: Response): Promise<void> {
  const { categoryId, keyword, page = 0, size = 10 } = req.query;
  const productRepo = AppDataSource.getRepository(Product);

  const qb = productRepo
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "c")
    .where("p.isActive = :active", { active: true })
    .andWhere("p.deletedAt IS NULL");

  if (categoryId) {
    qb.andWhere("p.categoryId = :categoryId", { categoryId: parseInt(categoryId as string) })
      .andWhere("(c.isActive = true OR c.id IS NULL)");
  }

  if (keyword) {
    qb.andWhere("LOWER(p.name) LIKE LOWER(:keyword)", { keyword: `%${keyword}%` });
  }

  const total = await qb.getCount();
  const products = await qb
    .skip(parseInt(page as string) * parseInt(size as string))
    .take(parseInt(size as string))
    .orderBy("p.createdAt", "DESC")
    .getMany();

  const results = await Promise.all(products.map(async (p) => mapProductResponse(p)));

  res.json({
    content: results,
    totalElements: total,
    totalPages: Math.ceil(total / parseInt(size as string)),
    size: parseInt(size as string),
    number: parseInt(page as string),
  });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const productRepo = AppDataSource.getRepository(Product);

  const product = await productRepo
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "c")
    .where("p.id = :id", { id: parseInt(id) })
    .andWhere("p.isActive = true")
    .andWhere("p.deletedAt IS NULL")
    .getOne();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(await mapProductResponse(product));
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  const categoryRepo = AppDataSource.getRepository("Category" as any);
  const categories = await categoryRepo.find({
    where: { isActive: true, deletedAt: null },
    order: { createdAt: "ASC" },
  });

  res.json(categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    isActive: c.isActive,
    createdAt: c.createdAt,
  })));
}

async function mapProductResponse(product: Product): Promise<any> {
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const tagMapRepo = AppDataSource.getRepository(ProductTagMap);

  const bestImage = await imageRepo
    .createQueryBuilder("pi")
    .where("pi.productId = :productId", { productId: product.id })
    .orderBy("pi.isPrimary", "DESC")
    .addOrderBy("pi.sortOrder", "ASC")
    .addOrderBy("pi.id", "ASC")
    .getOne();

  const tags = await tagMapRepo
    .createQueryBuilder("ptm")
    .innerJoin("ptm.tag", "pt")
    .where("ptm.productId = :productId", { productId: product.id })
    .select("pt.displayName")
    .getRawMany();

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    imageUrl: bestImage?.imageUrl || null,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    categoryId: product.categoryId,
    categoryName: product.category?.name || null,
    tags: tags.map((t: any) => t.displayName),
  };
}
