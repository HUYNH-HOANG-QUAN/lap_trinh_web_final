// =====================================================
// pages/OrderDetailPage.jsx – Chi tiết một đơn hàng
// Props: order, navigate
// =====================================================

import { formatPrice } from "../utils/productHelpers";
import { transformOrderFromBE } from "../utils/orderHelpers";

const STATUS_CONFIG = {
  PENDING:     { label: "Chờ xác nhận",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "#f59e0b" },
  CONFIRMED:   { label: "Đã xác nhận",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "#8b5cf6" },
  DELIVERED:   { label: "Chờ thanh toán",  color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "#3b82f6" },
  COMPLETED:   { label: "Hoàn thành",   color: "var(--green)", bg: "rgba(34,197,94,0.1)", border: "var(--green)" },
  CANCELLED:   { label: "Đã hủy",         color: "var(--red)",   bg: "rgba(239,68,68,0.1)", border: "var(--red)"   },
  CANCELLED_lower: { label: "Đã hủy",  color: "var(--red)",   bg: "rgba(239,68,68,0.1)", border: "var(--red)"   },
};

const OrderDetailPage = ({ order, navigate, onAddToCart, onConfirmPayment }) => {
  // If order is a raw BE response (no info, no subtotal), transform it
  const safeOrder = order && !order.info && !order.subtotal
    ? transformOrderFromBE(order)
    : order;

  if (!safeOrder) {
    return (
      <div className="section">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Không tìm thấy đơn hàng</h3>
          <button className="btn-primary" onClick={() => navigate("orders")}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusUpper = safeOrder.status?.toUpperCase();
  const statusLower = safeOrder.status?.toLowerCase();
  
  const statusKey = statusUpper === "CANCELLED" ? "CANCELLED"
    : statusUpper === "COMPLETED" ? "COMPLETED"
    : statusUpper === "DELIVERED" ? "DELIVERED"
    : statusUpper === "CONFIRMED" ? "CONFIRMED"
    : statusUpper === "PENDING" ? "PENDING"
    : statusLower === "cancelled" ? "CANCELLED_lower"
    : "PENDING";

  const st = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
  const isCancelled = statusLower === "cancelled" || statusUpper === "CANCELLED";
  const isDelivered = statusLower === "delivered" || statusUpper === "DELIVERED";
  const isCompleted = statusLower === "completed" || statusUpper === "COMPLETED";
  const isConfirmed = statusLower === "confirmed" || statusUpper === "CONFIRMED";
  const isPending = statusLower === "pending" || statusUpper === "PENDING";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate("home")}>Trang chủ</span>
        <span> / </span>
        <span onClick={() => navigate("orders")}>Đơn hàng</span>
        <span> / </span>
        <span style={{ color: "var(--primary)" }}>#{safeOrder.id}</span>
      </div>

      <section className="section">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32 }}
        >
          {/* Cột trái */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Trạng thái đơn hàng - hiển thị đơn giản */}
            <div
              style={{
                background: st.bg,
                border: `1px solid ${st.border}`,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: st.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}>
                  {isCancelled ? "✕" : "✓"}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: 12,
                    color: "var(--gray)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginBottom: 4,
                  }}>
                    Trạng thái đơn hàng
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 28,
                    color: st.color,
                    letterSpacing: 1,
                  }}>
                    {st.label}
                  </div>
                  {isPending && (
                    <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
                      Đang chờ admin xác nhận đơn hàng...
                    </div>
                  )}
                  {isConfirmed && (
                    <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
                      Đơn hàng đã được xác nhận, đang chuẩn bị giao...
                    </div>
                  )}
                  {isDelivered && (
                    <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
                      Đơn hàng đã được giao, vui lòng xác nhận thanh toán!
                    </div>
                  )}
                  {isCompleted && (
                    <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 4 }}>
                      ✓ Đơn hàng đã hoàn thành!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sản phẩm trong đơn */}
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: 16,
                padding: 28,
                border: "1px solid #2a2a2a",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 22,
                  marginBottom: 20,
                  letterSpacing: 1,
                }}
              >
                SẢN PHẨM ĐÃ ĐẶT
              </h3>
              {(safeOrder.items || []).map((item, idx) => {
                // Hỗ trợ cả data từ API (productName, quantity) và data cũ (product object)
                const productName = item.productName || item.product?.name || "Sản phẩm";
                const productSku = item.productSku || item.product?.sku || "";
                const qty = item.quantity || item.qty || 1;
                const unitPrice = item.unitPrice ?? item.product?.price ?? 0;
                const lineTotal = item.lineTotal ?? (unitPrice * qty);
                const emoji = item.product?.emoji || "🏋️";
                const productId = item.productId || item.product?.id || idx;

                return (
                  <div
                    key={productId}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "14px 0",
                      borderBottom: "1px solid #2a2a2a",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 52,
                        background: "var(--dark3)",
                        borderRadius: 12,
                        padding: "8px 12px",
                        flexShrink: 0,
                      }}
                    >
                      {emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--white)",
                          marginBottom: 4,
                        }}
                      >
                        {productName}
                      </div>
                      {productSku && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--primary)",
                            fontWeight: 700,
                          }}
                        >
                          SKU: {productSku}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--gray)",
                          marginTop: 4,
                        }}
                      >
                        {formatPrice(unitPrice)} × {qty}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 22,
                        color: "var(--primary)",
                      }}
                    >
                      {formatPrice(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Thông tin giao hàng */}
            {(safeOrder.info || safeOrder.recipientName) && (
              <div
                style={{
                  background: "var(--card-bg)",
                  borderRadius: 16,
                  padding: 28,
                  border: "1px solid #2a2a2a",
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 22,
                    marginBottom: 20,
                    letterSpacing: 1,
                  }}
                >
                  THÔNG TIN GIAO HÀNG
                </h3>
                {[
                  ["👤 Người nhận", safeOrder.recipientName || safeOrder.info?.fullName],
                  ["📞 Số điện thoại", safeOrder.recipientPhone || safeOrder.info?.phone],
                  [
                    "📍 Địa chỉ",
                    safeOrder.shippingAddress
                      ? `${safeOrder.shippingAddress}${safeOrder.province ? ", " + safeOrder.province : ""}`
                      : safeOrder.info?.address
                        ? `${safeOrder.info.address}, ${safeOrder.info.district || ""}, ${safeOrder.info.city || ""}`
                        : null,
                  ],
                  [
                    "💳 Thanh toán",
                    safeOrder.payMethod === "cod"
                      ? "Thanh toán khi nhận hàng"
                      : safeOrder.payMethod === "banking"
                        ? "Chuyển khoản"
                        : "VNPay",
                  ],
                ].map(
                  ([label, value]) =>
                    value && (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          gap: 16,
                          marginBottom: 12,
                          fontSize: 14,
                        }}
                      >
                        <span style={{ color: "var(--gray)", minWidth: 140 }}>
                          {label}
                        </span>
                        <span
                          style={{ color: "var(--white)", fontWeight: 600 }}
                        >
                          {value}
                        </span>
                      </div>
                    ),
                )}
              </div>
            )}
          </div>

          {/* Cột phải: Tổng kết */}
          <div className="cart-summary" style={{ position: "sticky", top: 90 }}>
            <h3 className="summary-title">TÓM TẮT ĐƠN #{safeOrder.id}</h3>
            <div
              style={{ fontSize: 13, color: "var(--gray)", marginBottom: 20 }}
            >
              Ngày đặt: {safeOrder.createdAt}
            </div>

            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{formatPrice(safeOrder.subtotal || safeOrder.total || 0)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span
                style={{
                  color: (safeOrder.shipping ?? safeOrder.shippingFee) === 0 ? "var(--green)" : "inherit",
                }}
              >
                {(safeOrder.shipping ?? safeOrder.shippingFee) === 0
                  ? "Miễn phí"
                  : formatPrice(safeOrder.shipping ?? safeOrder.shippingFee ?? 0)}
              </span>
            </div>
            {(safeOrder.discount ?? safeOrder.discountAmount ?? 0) > 0 && (
              <div className="summary-row">
                <span>Giảm giá</span>
                <span style={{ color: "var(--green)" }}>
                  - {formatPrice(safeOrder.discount ?? safeOrder.discountAmount)}
                </span>
              </div>
            )}
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Tổng cộng</span>
              <span>{formatPrice(safeOrder.total || safeOrder.totalAmount || 0)}</span>
            </div>

            <button
              className="btn-outline"
              style={{ width: "100%", padding: "12px 0", marginTop: 20 }}
              onClick={() => navigate("orders")}
            >
              ← Về danh sách đơn
            </button>
            {isDelivered && onConfirmPayment && (
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "12px 0", marginTop: 10 }}
                onClick={() => onConfirmPayment(safeOrder)}
              >
                Xác nhận thanh toán
              </button>
            )}
            {(isConfirmed || isCompleted) && onAddToCart && (
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "12px 0", marginTop: 10 }}
                onClick={() => {
                  (safeOrder.items || []).forEach((item) => {
                    const productObj = item.product || {
                      id: item.productId,
                      name: item.productName,
                      price: item.unitPrice,
                    };
                    if (productObj && productObj.id) {
                      onAddToCart(productObj);
                    }
                  });
                  navigate("cart");
                }}
              >
                Mua lại
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrderDetailPage;
