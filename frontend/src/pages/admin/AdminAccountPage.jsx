import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/adminService";

const PAGE_LIMIT = 20;

const AdminAccountPage = ({ showToast }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", passwordHash: "", status: "ACTIVE" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: PAGE_LIMIT };
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getAllAdminAccounts(params);
      const list = res?.data || res || [];
      setAdmins(list);
      setTotal(res?.total || list.length);
    } catch (error) {
      showToast(`Lỗi tải tài khoản: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditId(null);
    setForm({ fullName: "", email: "", phone: "", passwordHash: "", status: "ACTIVE" });
    setShowPwSection(false);
    setShowModal(true);
  };

  const handleOpenEdit = (admin) => {
    setIsEditMode(true);
    setEditId(admin.id);
    setForm({ fullName: admin.fullName, email: admin.email, phone: admin.phone || "", passwordHash: "", status: admin.status });
    setShowPwSection(false);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { showToast("Vui lòng nhập họ tên!"); return; }
    if (!form.email.trim()) { showToast("Vui lòng nhập email!"); return; }
    if (!isEditMode && !form.passwordHash) { showToast("Vui lòng nhập mật khẩu!"); return; }
    if (isEditMode && showPwSection && !form.passwordHash) { showToast("Vui lòng nhập mật khẩu mới!"); return; }

    try {
      setIsSubmitting(true);
      const payload = { ...form };
      if (!payload.passwordHash) delete payload.passwordHash;

      if (isEditMode) {
        await adminService.updateAdminAccount(editId, payload);
        showToast("Đã cập nhật tài khoản!");
      } else {
        await adminService.createAdminAccount(payload);
        showToast("Đã tạo tài khoản admin!");
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      showToast(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài khoản admin này?")) return;
    try {
      await adminService.deleteAdminAccount(id);
      showToast("Đã xóa!");
      fetchAdmins();
    } catch (error) {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

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

  const inputStyle = (focused) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: focused ? "1px solid rgba(255,92,0,0.5)" : "1px solid #333",
    background: "rgba(7, 9, 15, 0.5)",
    color: "var(--white)",
    fontSize: 14,
    outline: "none",
    transition: "all 0.3s",
    boxSizing: "border-box",
    boxShadow: focused ? "0 0 0 3px rgba(255,92,0,0.1)" : "none",
  });

  const Modal = () => !showModal ? null : (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
    >
      <div style={{
        background: "var(--card-bg)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480,
        border: "1px solid #333",
      }}>
        <h3 style={{ margin: "0 0 24px", fontSize: 20, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
          {isEditMode ? "SỬA TÀI KHOẢN ADMIN" : "THÊM TÀI KHOẢN ADMIN MỚI"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Họ tên *</label>
            <input name="fullName" value={form.fullName} onChange={handleInputChange}
              placeholder="VD: Nguyễn Văn A" style={inputStyle(false)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleInputChange}
              placeholder="admin@example.com" style={inputStyle(false)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={handleInputChange}
              placeholder="0901 234 567" style={inputStyle(false)} />
          </div>

          {isEditMode && !showPwSection && (
            <div style={{ marginBottom: 16 }}>
              <button type="button" onClick={() => setShowPwSection(true)}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                Đổi mật khẩu
              </button>
            </div>
          )}

          {(showPwSection || !isEditMode) && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>
                {isEditMode ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu *"}
              </label>
              <input name="passwordHash" type="password" value={form.passwordHash} onChange={handleInputChange}
                placeholder={isEditMode ? "Để trống nếu giữ mật khẩu cũ" : "Nhập mật khẩu"}
                style={inputStyle(false)} />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Trạng thái</label>
            <select name="status" value={form.status} onChange={handleInputChange}
              style={{ ...inputStyle(false), cursor: "pointer" }}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline" style={{ padding: "10px 24px" }} onClick={() => setShowModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, margin: 0 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>TÀI KHOẢN ADMIN</span>
        </h2>
        <div>
          <button className="btn-outline" style={{ marginRight: 12, padding: "10px 20px" }} onClick={handleBack}>← Quay lại</button>
          <button className="btn-primary" style={{ padding: "10px 20px" }} onClick={handleOpenAdd}>+ Thêm Admin</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 240, background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8 }}>
          <span>🔍</span>
          <input
            placeholder="Tìm tên, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }}
          />
        </div>
      </div>

      <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a", background: "var(--dark3)" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>ID</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Họ tên</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Email</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>SĐT</th>
                <th style={{ padding: "12px 20px", textAlign: "center", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Trạng thái</th>
                <th style={{ padding: "12px 20px", textAlign: "center", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--gray)" }}>Đang tải...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--gray)" }}>Chưa có tài khoản admin nào.</td>
                </tr>
              ) : admins.map(admin => (
                <tr key={admin.id} style={{ borderBottom: "1px solid #222", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a2e"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 20px", color: "var(--gray)" }}>#{admin.id}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>{admin.fullName}</td>
                  <td style={{ padding: "14px 20px", color: "var(--gray)" }}>{admin.email}</td>
                  <td style={{ padding: "14px 20px", color: "var(--gray)" }}>{admin.phone || "—"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: admin.status === "ACTIVE" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: admin.status === "ACTIVE" ? "var(--green)" : "var(--red)",
                    }}>
                      {admin.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 12, marginRight: 8 }}
                      onClick={() => handleOpenEdit(admin)}>Sửa</button>
                    <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }}
                      onClick={() => handleDelete(admin.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>

      <Modal />
    </div>
  );
};

export default AdminAccountPage;
