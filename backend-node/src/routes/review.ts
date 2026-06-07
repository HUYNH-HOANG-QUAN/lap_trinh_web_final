import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Review } from "../entity/Review";
import { Product } from "../entity/Product";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const reviewRepo = AppDataSource.getRepository(Review);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { productId, rating, comment, phone } = req.body;

  if (!productId || !rating) {
    res.status(400).json({ error: "Product ID and rating are required" });
    return;
  }

  const product = await productRepo.findOne({ where: { id: productId, isActive: true, deletedAt: null as any } });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const review = new Review();
  review.productId = productId;
  review.userId = user.id;
  review.rating = rating;
  review.comment = comment || "";
  review.phone = phone || "";
  review.isVerifiedPurchase = false;

  const saved = await reviewRepo.save(review);
  await updateProductRating(productId);

  res.status(201).json(await mapReviewResponse(saved));
}

export async function getProductReviews(req: any, res: Response): Promise<void> {
  const reviewRepo = AppDataSource.getRepository(Review);
  const reviews = await reviewRepo.find({
    where: { productId: parseInt(req.params.productId) },
    relations: ["user"],
    order: { createdAt: "DESC" },
  });
  res.json(await Promise.all(reviews.map(mapReviewResponse)));
}

export async function getMyReviews(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const reviewRepo = AppDataSource.getRepository(Review);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const reviews = await reviewRepo.find({
    where: { userId: user.id },
    relations: ["product"],
    order: { createdAt: "DESC" },
  });
  res.json(await Promise.all(reviews.map(mapReviewResponse)));
}

export async function updateReview(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const reviewRepo = AppDataSource.getRepository(Review);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const review = await reviewRepo.findOne({ where: { id: parseInt(req.params.reviewId) } });
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (review.userId !== user.id) {
    res.status(403).json({ error: "Forbidden", message: "You can only update your own reviews" });
    return;
  }

  const { rating, comment } = req.body;
  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  const saved = await reviewRepo.save(review);
  await updateProductRating(review.productId);
  res.json(await mapReviewResponse(saved));
}

export async function deleteReview(req: AuthRequest, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const reviewRepo = AppDataSource.getRepository(Review);

  const user = await userRepo.findOne({
    where: { email: req.user!.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const review = await reviewRepo.findOne({ where: { id: parseInt(req.params.reviewId) } });
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (review.userId !== user.id) {
    res.status(403).json({ error: "Forbidden", message: "You can only delete your own reviews" });
    return;
  }

  const productId = review.productId;
  await reviewRepo.remove(review);
  await updateProductRating(productId);
  res.status(204).send();
}

async function updateProductRating(productId: number): Promise<void> {
  const reviewRepo = AppDataSource.getRepository(Review);
  const productRepo = AppDataSource.getRepository(Product);

  const result = await reviewRepo
    .createQueryBuilder("r")
    .select("AVG(r.rating)", "avg")
    .addSelect("COUNT(r.id)", "count")
    .where("r.productId = :productId", { productId })
    .getRawOne();

  const avg = parseFloat(result.avg) || 0;
  const count = parseInt(result.count) || 0;

  const product = await productRepo.findOne({ where: { id: productId } });
  if (product) {
    product.ratingAvg = Math.round(avg * 100) / 100;
    product.ratingCount = count;
    await productRepo.save(product);
  }
}

async function mapReviewResponse(review: Review): Promise<any> {
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);

  const user = review.user ?? await userRepo.findOne({ where: { id: review.userId } });
  const product = review.product ?? await productRepo.findOne({ where: { id: review.productId } });

  return {
    id: review.id,
    productId: review.productId,
    productName: product?.name || "",
    userId: review.userId,
    userName: user?.fullName || "",
    rating: review.rating,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt,
    phone: review.phone,
  };
}
