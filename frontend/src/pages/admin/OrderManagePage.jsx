import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

const STATUS_LIST = [
  { key: "all",            label: "Tất cả"         },
  { key: "pending",        label: "Chờ xác nhận"   },
  { key: "confirmed",      label: "Đã xác nhận"    },
  { key: "delivered",      label: "Đã giao hàng"   },
  { key: "completed",      label: "Hoàn thành"     },
  { key: "cancelled",      label: "Đã hủy"         },
];

const STATUS_NEXT = {
  PENDING: "CONFIRMED",
  CONFIRMED: "DELIVERED",       // Shipper marks as delivered
};

const STATUS_COLOR = {
  PENDING:        "#f59e0b",
  CONFIRMED:      "#8b5cf6",    // Purple for confirmed
  DELIVERED:      "#3b82f6",    // Blue for delivered
  COMPLETED:      "var(--green)",
  CANCELLED:      "var(--red)",
};

const OrderManagePage = ({ showToast, navigate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });

  const fetchOrders = async (page = 0) => {
    try {
      setLoading(true);
      const data = await adminService.getAllOrders(page, pagination.size);
      // Handle both array and paginated response
      if (data.content) {
        setOrders(data.content);
        setPagination({
          page: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        });
      } else {
        setOrders(data);
      }
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      showToast(`❌ Lỗi tải đơn hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Sắp xếp theo thời gian (mới nhất lên đầu)
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.placedAt || b.createdAt) - new Date(a.placedAt || a.createdAt);
  });

  const filtered = sortedOrders.filter((o) => {
    let matchStatus = false;
    if (filter === "all") {
      matchStatus = true;
    } else {
      matchStatus = o.status?.toUpperCase() === filter.toUpperCase();
    }

    const matchSearch = String(o.orderCode).toLowerCase().includes(search.toLowerCase()) || 
                        (o.user?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
                        String(o.id).includes(search);
    return matchStatus && matchSearch;
  });

  const countByStatus = (key) => {
    if (key === "all") return orders.length;
    return orders.filter(o => o.status?.toUpperCase() === key.toUpperCase()).length;
  };

  const handleUpdateStatus = async (orderId, statusData) => {
    try {
      await adminService.updateOrderStatus(orderId, statusData);
      showToast(`✅ Đã cập nhật trạng thái đơn #${orderId}`);
      fetchOrders(pagination.page); // Tải lại danh sách
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      showToast(`❌ Lỗi cập nhật trạng thái: ${error.message}`);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      await handleUpdateStatus(orderId, { status: "CANCELLED" });
      showToast(`🗑 Đã hủy đơn #${orderId}`);
    } catch (error) {
      console.error("Lỗi hủy đơn:", error);
      showToast(`❌ Lỗi hủy đơn: ${error.message}`);
    }
  };

  return (
    <div className="section">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>ĐƠN HÀNG</span>
        </h2>
      </div>

      <div className="order-tabs" style={{ marginBottom: 20 }}>
        {STATUS_LIST.map((tab) => (
          <button key={tab.key} className={`order-tab ${filter === tab.key ? "active" : ""}`}
            onClick={() => setFilter(tab.key)}>
            {tab.label}
            <span style={{ marginLeft: 6, fontSize: 11, background: "var(--dark3)", padding: "2px 7px", borderRadius: 10 }}>
              {countByStatus(tab.key)}
            </span>
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <span>🔍</span>
          <input className="search-input" placeholder="Tìm theo mã đơn, tên khách..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ color: "var(--gray)", fontSize: 14 }}>
          {filtered.length} đơn hàng
        </span>
      </div>

      {loading ? (
        <div className="empty-state"><h3>Đang tải dữ liệu...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><h3>Không có đơn hàng</h3></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => {
            const isExpanded = expandedId === order.id || expandedId === order.orderCode;
            const orderStatus = order.status?.toUpperCase();
            const nextStatus = STATUS_NEXT[orderStatus];
            const statusColor = STATUS_COLOR[orderStatus] ?? "var(--gray)";
            const statusLabel = STATUS_LIST.find(s => s.key === orderStatus?.toLowerCase())?.label ?? order.status;

            return (
              <div key={order.id || order.orderCode} style={{ background: "var(--card-bg)", borderRadius: 14, border: "1px solid #2a2a2a", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 16, padding: "16px 20px", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : (order.id || order.orderCode))}>

                  <div>
                    <div style={{ fontSize: 13, color: "var(--gray)" }}>Mã đơn</div>
                    <div style={{ fontWeight: 700, color: "var(--white)" }}>{order.orderCode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--gray)" }}>Khách hàng</div>
                    <div style={{ fontWeight: 700, color: "var(--white)" }}>{order.user?.fullName || order.recipientName || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>{order.user?.phone || order.recipientPhone || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--gray)" }}>Tổng tiền</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--primary)" }}>{formatPrice(order.totalAmount || order.total)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 4 }}>Trạng thái</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, border: `1px solid ${statusColor}`, padding: "4px 10px", borderRadius: 6 }}>
                      {statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--gray)" }}>{isExpanded ? "▲" : "▼"}</div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid #2a2a2a", padding: "20px 20px" }}>
                    <div style={{ marginBottom: 20 }}>
                      {order.items?.map((item, idx) => (
                        <div key={item.id || item.productId || idx} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                          <span style={{ flex: 1, fontSize: 13, color: "var(--white)" }}>
                            {item.productName} 
                          </span>
                          <span style={{ fontSize: 13, color: "var(--gray)" }}>x{item.quantity}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{formatPrice(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>

                    {order.shippingAddressLine1 && (
                      <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 20 }}>
                        📍 {order.shippingAddressLine1}, {order.shippingCity}, {order.shippingProvince}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {nextStatus && (
                        <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}
                          onClick={() => handleUpdateStatus(order.id, { status: nextStatus })}>
                          {order.status === "PENDING" ? "✓ Xác nhận đơn hàng" : 
                           "🚚 Đã giao hàng"}
                        </button>
                      )}
                      {order.status === "PENDING" && (
                        <button className="btn-danger" onClick={() => handleCancel(order.id)}>Hủy đơn</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        // {/* Pagination Controls */}
        // {pagination.totalPages > 1 && (
        //   <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
        //     <button
        //       className="btn-outline"
        //       disabled={pagination.page === 0}
        //       onClick={() => fetchOrders(pagination.page - 1)}
        //       style={{ padding: "10px 20px", fontSize: 13 }}
        //     >
        //       ← Trước
        //     </button>
        //     <span style={{ color: "var(--gray)", fontSize: 14 }}>
        //       Trang {pagination.page + 1} / {pagination.totalPages}
        //     </span>
        //     <button
        //       className="btn-outline"
        //       disabled={pagination.page >= pagination.totalPages - 1}
        //       onClick={() => fetchOrders(pagination.page + 1)}
        //       style={{ padding: "10px 20px", fontSize: 13 }}
        //     >
        //       Sau →
        //     </button>
        //   </div>
        // )}
      )}
    </div>
  );
};

export default OrderManagePage;
