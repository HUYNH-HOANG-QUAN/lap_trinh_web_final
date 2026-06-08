import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { authenticate, requireAdmin } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import { Response } from "express";
import { AppDataSource } from "./config/database";
import { AuthRequest } from "./middleware/auth";
import * as authRoutes from "./routes/auth";
import * as publicRoutes from "./routes/public";
import * as userRoutes from "./routes/user";
import * as orderRoutes from "./routes/order";
import * as reviewRoutes from "./routes/review";
import * as messageRoutes from "./routes/message";
import * as adminRoutes from "./routes/admin";
import * as dashboardRoutes from "./routes/dashboard";
import * as paymentRoutes from "./routes/payment";

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use("/static", express.static(path.join(__dirname, "../static")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================================
// Auth routes (public)
// ============================================
app.post("/api/auth/login", authRoutes.login);
app.post("/api/auth/register", authRoutes.register);
app.post("/api/auth/verify-register", authRoutes.verifyRegister);
app.post("/api/auth/complete-register", authRoutes.completeRegister);
app.post("/api/auth/logout", authRoutes.logout);
app.post("/api/auth/forgot-password", authRoutes.forgotPassword);
app.post("/api/auth/verify-forgot-password", authRoutes.verifyForgotPassword);
app.post("/api/auth/resend-otp", authRoutes.resendOtp);
app.post("/api/auth/reset-password", authRoutes.resetPassword);

// ============================================
// Public product/category routes
// ============================================
app.get("/api/public/products", publicRoutes.getProducts);
app.get("/api/public/products/:id", publicRoutes.getProductById);
app.get("/api/public/categories", publicRoutes.getCategories);
app.get("/api/v1/products", publicRoutes.getProducts);
app.get("/api/v1/products/:id", publicRoutes.getProductById);
app.get("/api/v1/categories", publicRoutes.getCategories);

// ============================================
// Authenticated user routes
// ============================================
app.get("/api/users/profile", authenticate, userRoutes.getProfile);
app.put("/api/users/profile", authenticate, userRoutes.updateProfile);

// ============================================
// Order routes
// ============================================
app.post("/api/orders/create", authenticate, orderRoutes.createOrder);
app.post("/api/orders/guest", orderRoutes.createGuestOrder);
app.get("/api/orders/my-orders", authenticate, orderRoutes.getMyOrders);

// ============================================
// Review routes
// ============================================
app.post("/api/reviews", authenticate, reviewRoutes.createReview);
app.get("/api/reviews/product/:productId", reviewRoutes.getProductReviews as any);
app.get("/api/reviews/my-reviews", authenticate, reviewRoutes.getMyReviews);
app.put("/api/reviews/:reviewId", authenticate, reviewRoutes.updateReview);
app.delete("/api/reviews/:reviewId", authenticate, reviewRoutes.deleteReview);

// ============================================
// Message routes
// ============================================
app.get("/api/messages/my", authenticate, messageRoutes.getMyMessages);
app.post("/api/messages/send", authenticate, messageRoutes.sendMessage);
app.get("/api/messages/admin/all", authenticate, requireAdmin, messageRoutes.getAllMessages);
app.get("/api/messages/admin/:id", authenticate, requireAdmin, messageRoutes.getMessage);
app.post("/api/messages/admin/:id/reply", authenticate, requireAdmin, messageRoutes.replyMessage);
app.post("/api/messages/admin/:id/read", authenticate, requireAdmin, messageRoutes.markAsRead);
app.get("/api/messages/admin/unread-count", authenticate, requireAdmin, messageRoutes.getUnreadCount);

// ============================================
// Banking / payment
// ============================================
app.post("/api/v1/banking/confirm/:orderId", authenticate, orderRoutes.confirmBankingPayment);
app.get("/api/v1/banking/pending-count", authenticate, orderRoutes.getPendingConfirmCount);

// ============================================
// VNPay
// ============================================
app.get("/api/v1/payment/create/:orderId", paymentRoutes.createPaymentUrl);
app.get("/api/v1/payment/vnpay-return", paymentRoutes.vnpayReturn);
app.post("/api/v1/payment/vnpay-ipn", paymentRoutes.vnpayIpn);

// ============================================
// Admin routes (API endpoints)
// ============================================
app.get("/api/admin/user/all", authenticate, requireAdmin, adminRoutes.getAllUsers);
app.post("/api/admin/user/add", authenticate, requireAdmin, adminRoutes.createUser);
app.put("/api/admin/user/:id", authenticate, requireAdmin, adminRoutes.updateUser);
app.delete("/api/admin/user/:id", authenticate, requireAdmin, adminRoutes.deleteUser);

app.get("/api/admin/category/all", authenticate, requireAdmin, adminRoutes.getAllCategoriesAdmin);
app.post("/api/admin/category/add", authenticate, requireAdmin, adminRoutes.createCategory);
app.put("/api/admin/category/:id", authenticate, requireAdmin, adminRoutes.updateCategory);
app.delete("/api/admin/category/:id", authenticate, requireAdmin, adminRoutes.deleteCategory);

app.get("/api/admin/product/all", authenticate, requireAdmin, adminRoutes.getAllProductsAdmin);
app.post("/api/admin/product/add", authenticate, requireAdmin, adminRoutes.createProduct);
app.put("/api/admin/product/:id", authenticate, requireAdmin, adminRoutes.updateProduct);
app.delete("/api/admin/product/:id", authenticate, requireAdmin, adminRoutes.deleteProduct);

app.get("/api/admin/order/all", authenticate, requireAdmin, adminRoutes.getAllOrdersAdmin);
app.get("/api/admin/order/counts-by-status", authenticate, requireAdmin, adminRoutes.getOrderCountsByStatus);
app.get("/api/admin/order/:id", authenticate, requireAdmin, adminRoutes.getOrderByIdAdmin);
app.put("/api/admin/order/:id/status", authenticate, requireAdmin, orderRoutes.updateOrderStatus);

app.get("/api/admin/dashboard/stats", authenticate, requireAdmin, dashboardRoutes.getDashboardStats);
app.get("/api/admin/notifications", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const messageRepo = AppDataSource.getRepository("Message" as any);
  const orderRepo = AppDataSource.getRepository("Order" as any);
  const unreadMessages = await messageRepo.count({ where: { status: "UNREAD" as any } });
  const pendingOrders = await orderRepo.count({ where: { status: "PENDING" as any, paymentStatus: "UNPAID" as any } });
  res.json({ count: unreadMessages + pendingOrders });
});

// Admin account management
app.get("/api/admin/account/all", authenticate, requireAdmin, adminRoutes.getAllAdminAccounts);
app.post("/api/admin/account/add", authenticate, requireAdmin, adminRoutes.createAdminAccount);
app.put("/api/admin/account/:id/password", authenticate, requireAdmin, adminRoutes.changeAdminPassword);
app.put("/api/admin/account/:id", authenticate, requireAdmin, adminRoutes.updateAdminAccount);
app.delete("/api/admin/account/:id", authenticate, requireAdmin, adminRoutes.deleteAdminAccount);

// ============================================
// Admin view routes (EJS templates)
// ============================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views/admin"));

app.get("/admin", authenticate, requireAdmin, (req: any, res) => {
  res.render("index", { user: req.user });
});
app.get("/admin/login", (req, res) => {
  res.render("login");
});
app.get("/admin/user/list", authenticate, requireAdmin, (req: any, res) => {
  res.render("users/list", { user: req.user });
});
app.get("/admin/product/list", authenticate, requireAdmin, (req: any, res) => {
  res.render("product/list", { user: req.user });
});
app.get("/admin/product/add", authenticate, requireAdmin, (req: any, res) => {
  res.render("product/add", { user: req.user });
});
app.get("/admin/product/category", authenticate, requireAdmin, (req: any, res) => {
  res.render("product/category", { user: req.user });
});
app.get("/admin/order/list", authenticate, requireAdmin, (req: any, res) => {
  res.render("orders/list", { user: req.user });
});
app.get("/admin/order/detail", authenticate, requireAdmin, (req: any, res) => {
  res.render("orders/detail", { user: req.user });
});
app.get("/admin/marketing/discount", authenticate, requireAdmin, (req: any, res) => {
  res.render("marketing/discount", { user: req.user });
});
app.get("/admin/reviews/review", authenticate, requireAdmin, (req: any, res) => {
  res.render("reviews/review", { user: req.user });
});
app.get("/admin/account/list", authenticate, requireAdmin, (req: any, res) => {
  res.render("accounts/list", { user: req.user });
});
app.get("/admin/contact/inbox", authenticate, requireAdmin, (req: any, res) => {
  res.render("contact/index", { user: req.user });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
