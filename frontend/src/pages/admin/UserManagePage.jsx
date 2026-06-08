import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/adminService";

const PAGE_LIMIT = 20;

const UserManagePage = ({ showToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter / sort / page state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // Stats
  const [stats, setStats] = useState({ total: 0, admins: 0, customers: 0, active: 0 });

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", passwordHash: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: PAGE_LIMIT,
        sortBy,
        sortDir,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getAllUsers(params);
      const list = Array.isArray(res) ? res : (res.data || []);
      const totalVal = res.total || list.length;
      setUsers(list);
      setTotal(totalVal);

      // Stats from ALL users (not just current page) by fetching with large limit
      const statsRes = await adminService.getAllUsers({ limit: 1000, search: search.trim(), role: roleFilter, status: statusFilter });
      const allUsers = Array.isArray(statsRes) ? statsRes : (statsRes.data || []);
      setStats({
        total: totalVal,
        admins: allUsers.filter(u => u.role === "ADMIN").length,
        customers: allUsers.filter(u => u.role === "CUSTOMER").length,
        active: allUsers.filter(u => u.status === "ACTIVE").length,
      });
    } catch (error) {
      showToast(`Lỗi tải danh sách: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortDir, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setSortBy(field); setSortDir("ASC"); }
    setPage(1);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ fullName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", passwordHash: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditMode(true);
    setEditUserId(user.id);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "CUSTOMER",
      status: user.status || "ACTIVE",
      passwordHash: "",
    });
    setShowModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!formData.email) { showToast("Vui lòng nhập Email!"); return; }
    if (!isEditMode && !formData.passwordHash) { showToast("Vui lòng nhập Mật khẩu cho user mới!"); return; }
    try {
      setIsSubmitting(true);
      const payload = { ...formData };
      if (formData.passwordHash) payload.passwordHash = formData.passwordHash;
      if (isEditMode) { await adminService.updateUser(editUserId, payload); showToast("Đã cập nhật!"); }
      else { await adminService.createUser(payload); showToast("Đã tạo người dùng!"); }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      showToast(`Lỗi: ${error.message}`);
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa người dùng này?")) return;
    try {
      await adminService.deleteUser(id);
      showToast("Đã xóa!");
      fetchUsers();
    } catch (error) { showToast(`Lỗi: ${error.message}`); }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return " ↕";
    return sortDir === "ASC" ? " ↑" : " ↓";
  };

  const Th = ({ field, children }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ cursor: "pointer", userSelect: "none", padding: "12px", textAlign: "left", color: sortBy === field ? "var(--primary)" : "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}
    >
      {children}{sortIcon(field)}
    </th>
  );

  const Pagination = () => totalPages <= 1 ? null : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid #2a2a2a" }}>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>Trang {page} / {totalPages} — {total} tài khoản</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 13 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return <button key={p} className={p === page ? "btn-primary" : "btn-outline"} style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => setPage(p)}>{p}</button>;
        })}
        <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 13 }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
      </div>
    </div>
  );

  return (
    <div className="section">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, margin: 0 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>NGƯỜI DÙNG</span>
        </h2>
        <div>
          <button className="btn-outline" style={{ marginRight: 12, padding: "10px 20px" }} onClick={() => {}}>← Quay lại</button>
          <button className="btn-primary" style={{ padding: "10px 20px" }} onClick={handleOpenAdd}>+ Thêm User</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Tổng tài khoản", value: total, color: "var(--primary)" },
          { label: "Người dùng", value: stats.customers, color: "var(--blue)" },
          { label: "Quản trị viên", value: stats.admins, color: "var(--amber)" },
          { label: "Đang hoạt động", value: stats.active, color: "var(--green)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--card-bg)", borderRadius: 14, padding: "18px 20px", border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8 }}>
          <span>🔍</span>
          <input
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }}
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 14, outline: "none" }}>
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 14, outline: "none" }}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a", background: "var(--dark3)" }}>
                <Th field="id">ID</Th>
                <Th field="fullName">Họ tên</Th>
                <Th field="email">Email</Th>
                <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>SĐT</th>
                <Th field="role">Vai trò</Th>
                <Th field="status">Trạng thái</Th>
                <Th field="createdAt">Ngày tạo</Th>
                <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Không có người dùng nào.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "14px 12px", color: "var(--gray)", fontSize: 12 }}>#{u.id}</td>
                  <td style={{ padding: "14px 12px", color: "var(--white)", fontWeight: 600 }}>{u.fullName || "—"}</td>
                  <td style={{ padding: "14px 12px", color: "var(--gray)" }}>{u.email}</td>
                  <td style={{ padding: "14px 12px", color: "var(--gray)" }}>{u.phone || "—"}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                      background: u.role === "ADMIN" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                      color: u.role === "ADMIN" ? "#f59e0b" : "#3b82f6",
                      border: `1px solid ${u.role === "ADMIN" ? "#f59e0b" : "#3b82f6"}`
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                      background: u.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: u.status === "ACTIVE" ? "#10b981" : "#ef4444",
                      border: `1px solid ${u.status === "ACTIVE" ? "#10b981" : "#ef4444"}`
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px", color: "var(--gray)", fontSize: 12 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <button onClick={() => handleOpenEdit(u)} style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", marginRight: 16, fontWeight: 700 }}>Sửa</button>
                    <button onClick={() => handleDelete(u.id)} style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", fontWeight: 700 }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--card-bg)", padding: 36, borderRadius: 20, width: 450, border: "1px solid #333", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 24, letterSpacing: 1 }}>
              {isEditMode ? "SỬA " : "THÊM "}<span style={{ color: "var(--primary)" }}>NGƯỜI DÙNG</span>
            </h3>
            <form onSubmit={handleSubmitUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>Họ và tên</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Nguyễn Văn A" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>Email <span style={{color: "var(--primary)"}}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="example@gmail.com" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }} />
              </div>
              {!isEditMode && (
                <div>
                  <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>
                    Mật khẩu <span style={{color: "var(--primary)"}}>*</span>
                  </label>
                  <input type="password" name="passwordHash" value={formData.passwordHash} onChange={handleInputChange} required placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>Số điện thoại</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0987654321" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>Vai trò</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }}>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: "var(--gray)", display: "block", marginBottom: 6 }}>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#111", border: "1px solid #333", color: "white", outline: "none" }}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)} style={{ padding: "12px 24px" }}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: "12px 24px" }}>
                  {isSubmitting ? "Đang xử lý..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagePage;
