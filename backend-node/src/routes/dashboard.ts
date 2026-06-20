import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { In } from "typeorm";

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const orderRepo = AppDataSource.getRepository(Order);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate start of week (Monday)
  const dayOfWeek = startOfDay.getDay(); // 0 = Sunday, 1 = Monday, ...
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Go back to Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const twelveMonthsAgo = new Date(startOfMonth);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

  const completedStatuses = ["COMPLETED", "completed"];
  const pendingStatuses = ["PENDING", "pending"];

  const totalOrders = await orderRepo.count();
  const pendingOrders = await orderRepo.count({ where: { status: In(pendingStatuses) } });
  const completedOrders = await orderRepo
    .createQueryBuilder("o")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .getCount();

  const revenueResult = await orderRepo
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.totalAmount), 0)", "total")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .getRawOne();

  const todayOrders = await orderRepo
    .createQueryBuilder("o")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: startOfDay })
    .getCount();

  const todayRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.totalAmount), 0)", "total")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: startOfDay })
    .getRawOne();

  const weekRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.totalAmount), 0)", "total")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: startOfWeek })
    .getRawOne();

  const monthRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.totalAmount), 0)", "total")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: startOfMonth })
    .getRawOne();

  const yearRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.totalAmount), 0)", "total")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: startOfYear })
    .getRawOne();

  const dailyRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("DATE(o.completedAt) as period, COALESCE(SUM(o.totalAmount), 0) as revenue, COUNT(o.id) as orderCount")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: thirtyDaysAgo })
    .groupBy("DATE(o.completedAt)")
    .orderBy("period", "ASC")
    .getRawMany();

  const monthlyRevenue = await orderRepo
    .createQueryBuilder("o")
    .select("DATE_FORMAT(o.completedAt, '%Y-%m') as period, COALESCE(SUM(o.totalAmount), 0) as revenue, COUNT(o.id) as orderCount")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .andWhere("o.completedAt >= :start", { start: twelveMonthsAgo })
    .groupBy("DATE_FORMAT(o.completedAt, '%Y-%m')")
    .orderBy("period", "ASC")
    .getRawMany();

  const bestSellers = await AppDataSource
    .createQueryBuilder()
    .select("oi.product_id", "productId")
    .addSelect("oi.product_name", "productName")
    .addSelect("SUM(oi.quantity)", "totalSold")
    .addSelect("SUM(oi.line_total)", "totalRevenue")
    .from(OrderItem, "oi")
    .innerJoin("oi.order", "o")
    .where("o.status IN (:...statuses)", { statuses: completedStatuses })
    .groupBy("oi.product_id")
    .addGroupBy("oi.product_name")
    .orderBy("totalSold", "DESC")
    .limit(10)
    .getRawMany();

  const revenueByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(startOfDay);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const found = dailyRevenue.find((d: any) => {
      // Handle if d.period is a Date object
      const periodStr = d.period instanceof Date ? d.period.toISOString().split("T")[0] : String(d.period);
      return periodStr === dateStr;
    });
    revenueByDay.push({
      period: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      revenue: parseFloat(found?.revenue) || 0,
      orderCount: parseInt(found?.orderCount) || 0,
    });
  }

  const revenueByMonth = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(startOfMonth);
    date.setMonth(date.getMonth() - i);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const found = monthlyRevenue.find((d: any) => {
      return String(d.period) === periodKey;
    });
    revenueByMonth.push({
      period: `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
      revenue: parseFloat(found?.revenue) || 0,
      orderCount: parseInt(found?.orderCount) || 0,
    });
  }

  res.json({
    totalRevenue: parseFloat(revenueResult.total) || 0,
    totalOrders,
    completedOrders,
    pendingOrders,
    todayOrders,
    todayRevenue: parseFloat(todayRevenue.total) || 0,
    weekRevenue: parseFloat(weekRevenue.total) || 0,
    monthRevenue: parseFloat(monthRevenue.total) || 0,
    yearRevenue: parseFloat(yearRevenue.total) || 0,
    revenueByDay,
    revenueByMonth,
    bestSellingProducts: bestSellers.map((b: any) => ({
      productId: parseInt(b.productId),
      productName: b.productName,
      totalSold: parseInt(b.totalSold),
      totalRevenue: parseFloat(b.totalRevenue),
    })),
  });
}
