import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

const UserManagePage = ({ showToast, navigate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });

  // States cho Form Thêm/Sửa User
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", passwordHash: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gọi API lấy danh sách
  const fetchUsers = async (page = 0) => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers(page, pagination.size, {
        keyword: search.trim() || undefined,
        status: filterStatus || undefined,
      });
      // Handle both array and paginated response
      if (data.content) {
        setUsers(data.content);
        setPagination({
          page: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        });
      } else {
        setUsers(data);
      }
    } catch (error) {
      showToast(`❌ Lỗi tải danh sách User: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus]);

  // Handle thay đổi input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Form
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showToast("❌ Vui lòng nhập Email!");
      return;
    }
    if (!isEditMode && !formData.passwordHash) {
      showToast("❌ Vui lòng nhập Mật khẩu cho user mới!");
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { ...formData, password_hash: formData.passwordHash };
      
      if (isEditMode) {
        await adminService.updateUser(editUserId, payload);
        showToast("✅ Cập nhật người dùng thành công!");
      } else {
        await adminService.createUser(payload);
        showToast("✅ Tạo người dùng thành công!");
      }
      
      setShowModal(false);
      setFormData({ fullName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", passwordHash: "" });
      fetchUsers(); // Tải lại danh sách
    } catch (error) {
      showToast(`❌ Lỗi khi lưu: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal Thêm mới
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ fullName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", passwordHash: "" });
    setShowModal(true);
  };

  // Mở modal Sửa
  const handleOpenEdit = (user) => {
    setIsEditMode(true);
    setEditUserId(user.id);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "CUSTOMER",
      status: user.status || "ACTIVE",
      passwordHash: "" // Trống mật khẩu, nếu người dùng nhập mới thì cập nhật
    });
    setShowModal(true);
  };

  // Gọi API khoá/mở khoá
  const handleToggleLock = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const confirmMsg = newStatus === "LOCKED" 
      ? "Bạn có chắc muốn khoá user này không?" 
      : "Bạn có chắc muốn mở khoá user này không?";
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await adminService.updateUser(user.id, { status: newStatus });
      showToast(`✅ Đã ${newStatus === "LOCKED" ? "khoá" : "mở khoá"} user thành công!`);
      fetchUsers(); // Lấy lại danh sách mới
    } catch (error) {
      showToast(`❌ Lỗi khi ${newStatus === "LOCKED" ? "khoá" : "mở khoá"}: ${error.message}`);
    }
  };

  return (
    <div className="section">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, margin: 0 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>NGƯỜI DÙNG</span>
        </h2>
        <div>
          <button className="btn-outline" onClick={() => navigate("admin-dashboard")} style={{ marginRight: 12, padding: "10px 20px" }}>
            ← Quay lại
          </button>
          <button className="btn-primary" onClick={handleOpenAdd} style={{ padding: "10px 20px" }}>
            + Thêm User
          </button>
        </div>
      </div>

      {/* Bộ lọc + Tìm kiếm */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 240 }}>
          <span>🔍</span>
          <input
            className="search-input"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "var(--dark3)",
            color: filterStatus ? "var(--primary)" : "var(--gray)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            outline: "none",
            minWidth: 150,
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="LOCKED">LOCKED</option>
        </select>
        {(search || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); }}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #ef4444",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <span style={{ color: "var(--gray)", fontSize: 14, alignSelf: "center" }}>
          {pagination.totalElements || users.length} người dùng
        </span>
      </div>

      {/* Bảng dữ liệu */}
      <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 28, border: "1px solid #2a2a2a" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--gray)", padding: "40px 0" }}>Đang tải dữ liệu từ Backend...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--gray)", padding: "40px 0" }}>Chưa có người dùng nào.</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>ID</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>HỌ TÊN</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>EMAIL</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>SĐT</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>VAI TRÒ</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "var(--gray)", fontWeight: 700 }}>TRẠNG THÁI</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "var(--gray)", fontWeight: 700 }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "16px 12px", color: "var(--white)", fontWeight: 700 }}>#{u.id}</td>
                      <td style={{ padding: "16px 12px", color: "var(--white)" }}>{u.fullName || "—"}</td>
                      <td style={{ padding: "16px 12px", color: "var(--gray)" }}>{u.email}</td>
                      <td style={{ padding: "16px 12px", color: "var(--gray)" }}>{u.phone || "—"}</td>
                      <td style={{ padding: "16px 12px" }}>
                        <span style={{ 
                          padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                          background: u.role === "ADMIN" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: u.role === "ADMIN" ? "#f59e0b" : "#3b82f6",
                          border: `1px solid ${u.role === "ADMIN" ? "#f59e0b" : "#3b82f6"}`
                        }}>
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <span style={{ 
                          padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                          background: u.status === "ACTIVE" ? "rgba(34, 197, 94, 0.15)" : 
                                      u.status === "LOCKED" ? "rgba(239, 68, 68, 0.15)" : 
                                      "rgba(156, 163, 175, 0.15)",
                          color: u.status === "ACTIVE" ? "#22c55e" : 
                                 u.status === "LOCKED" ? "#ef4444" : 
                                 "#9ca3af",
                          border: `1px solid ${u.status === "ACTIVE" ? "#22c55e" : 
                                              u.status === "LOCKED" ? "#ef4444" : 
                                              "#9ca3af"}`
                        }}>
                          {u.status || "ACTIVE"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px", textAlign: "right" }}>
                      <button onClick={() => handleOpenEdit(u)} style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", marginRight: 16, fontWeight: 700 }}>Sửa</button>
                      <button onClick={() => handleToggleLock(u)} style={{ background: "transparent", border: "none", color: u.status === "ACTIVE" ? "var(--red)" : "var(--green)", cursor: "pointer", fontWeight: 700 }}>
                        {u.status === "ACTIVE" ? "Khoá" : "Mở khoá"}
                      </button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
                <button 
                  className="btn-outline" 
                  disabled={pagination.page === 0} 
                  onClick={() => fetchUsers(pagination.page - 1)}
                  style={{ padding: "8px 16px" }}
                >
                  ← Trước
                </button>
                <span style={{ color: "var(--gray)", fontSize: 14 }}>
                  Trang {pagination.page + 1} / {pagination.totalPages}
                </span>
                <button 
                  className="btn-outline" 
                  disabled={pagination.page >= pagination.totalPages - 1} 
                  onClick={() => fetchUsers(pagination.page + 1)}
                  style={{ padding: "8px 16px" }}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Thêm/Sửa User */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{ background: "var(--card-bg)", padding: 36, borderRadius: 20, width: 450, border: "1px solid #333", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, marginBottom: 24, letterSpacing: 1 }}>
              {isEditMode ? "SỬA " : "THÊM "}<span style={{ color: "var(--primary)" }}>NGƯỜI DÙNG</span>
            </h3>
            
            <form onSubmit={handleSubmitUser} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)} style={{ padding: "12px 24px" }}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: "12px 24px" }}>
                  {isSubmitting ? "Đang xử lý..." : "Lưu User"}
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
