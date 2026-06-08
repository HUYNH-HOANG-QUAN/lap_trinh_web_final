import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { AuthRequest } from "../middleware/auth";

function toMySQLDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderRepo = AppDataSource.getRepository(Order);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = addDays(today, -29);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const dayOfWeek = today.getDay();
    const daysToMonday = (dayOfWeek + 6) % 7;
    const weekStart = addDays(today, -daysToMonday);
    const weekEnd = addDays(weekStart, 7);

    const completedStatuses = ["COMPLETED", "DELIVERED"];

    const totalOrders = await orderRepo.count();
    const pendingOrders = await orderRepo.count({ where: { status: "PENDING" as any } });
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
      .andWhere("o.completedAt >= :today", { today: toMySQLDate(today) })
      .getCount();

    const todayRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.totalAmount), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :today", { today: toMySQLDate(today) })
      .getRawOne();

    const monthRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.totalAmount), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :start", { start: toMySQLDate(startOfMonth) })
      .getRawOne();

    const yearRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.totalAmount), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :start", { start: toMySQLDate(startOfYear) })
      .getRawOne();

    const weeklyRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.totalAmount), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :weekStart AND o.completedAt < :weekEnd",
        { weekStart: toMySQLDate(weekStart), weekEnd: toMySQLDate(weekEnd) })
      .getRawOne();

    const weeklyRevenueData = await orderRepo
      .createQueryBuilder("o")
      .select("DATE(o.completedAt) as period, COALESCE(SUM(o.totalAmount), 0) as revenue, COUNT(o.id) as orderCount")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :weekStart AND o.completedAt < :weekEnd",
        { weekStart: toMySQLDate(weekStart), weekEnd: toMySQLDate(weekEnd) })
      .groupBy("DATE(o.completedAt)")
      .orderBy("period", "ASC")
      .getRawMany();

    const revenueByWeek = [];
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = date.toISOString().slice(0, 10);
      const found = weeklyRevenueData.find((d: any) => {
        if (!d.period) return false;
        const p = String(d.period).slice(0, 10);
        return p === dateStr;
      });
      revenueByWeek.push({
        period: dayNames[i],
        date: dateStr,
        revenue: parseFloat(found?.revenue) || 0,
        orderCount: parseInt(found?.orderCount) || 0,
      });
    }

    const dailyRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("DATE(o.completedAt) as period, COALESCE(SUM(o.totalAmount), 0) as revenue, COUNT(o.id) as orderCount")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :start", { start: toMySQLDate(thirtyDaysAgo) })
      .groupBy("DATE(o.completedAt)")
      .orderBy("period", "ASC")
      .getRawMany();

    const monthlyRevenue = await orderRepo
      .createQueryBuilder("o")
      .select("DATE_FORMAT(o.completedAt, '%Y-%m') as period, COALESCE(SUM(o.totalAmount), 0) as revenue, COUNT(o.id) as orderCount")
      .where("o.status IN (:...statuses)", { statuses: completedStatuses })
      .andWhere("o.completedAt >= :start", { start: toMySQLDate(twelveMonthsAgo) })
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
      const date = addDays(today, -i);
      const dateStr = date.toISOString().slice(0, 10);
      const found = dailyRevenue.find((d: any) => {
        if (!d.period) return false;
        const p = String(d.period).slice(0, 10);
        return p === dateStr;
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
      const found = monthlyRevenue.find((d: any) => d.period === periodKey);
      revenueByMonth.push({
        period: `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
        revenue: parseFloat(found?.revenue) || 0,
        orderCount: parseInt(found?.orderCount) || 0,
      });
    }

    res.json({
      totalRevenue: parseFloat(revenueResult?.total) || 0,
      totalOrders,
      completedOrders,
      pendingOrders,
      todayOrders,
      todayRevenue: parseFloat(todayRevenue?.total) || 0,
      monthRevenue: parseFloat(monthRevenue?.total) || 0,
      weekRevenue: parseFloat(weeklyRevenue?.total) || 0,
      yearRevenue: parseFloat(yearRevenue?.total) || 0,
      revenueByYear: [{
        period: `${now.getFullYear()}`,
        revenue: parseFloat(yearRevenue?.total) || 0,
        orderCount: completedOrders,
      }],
      revenueByWeek,
      revenueByDay,
      revenueByMonth,
      bestSellingProducts: bestSellers.map((b: any) => ({
        productId: parseInt(b.productId),
        productName: b.productName,
        totalSold: parseInt(b.totalSold),
        totalRevenue: parseFloat(b.totalRevenue),
      })),
    });
  } catch (err: any) {
    console.error("[Dashboard Error]", err.message);
    res.status(500).json({ error: "Dashboard error", message: err.message });
  }
}
