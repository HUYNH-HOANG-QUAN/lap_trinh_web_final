import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/adminService";

const PAGE_LIMIT = 20;

const CategoryManagePage = ({ showToast }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: PAGE_LIMIT };
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getAllCategories(params);
      const list = res?.data || res || [];
      setCategories(list);
      setTotal(res?.total || list.length);
    } catch (error) {
      showToast(`Lỗi tải danh mục: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditId(null);
    setForm({ name: "", slug: "", parentId: "", isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditMode(true);
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId || "", isActive: cat.isActive });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Vui lòng nhập tên danh mục!"); return; }
    if (!form.slug.trim()) { showToast("Vui lòng nhập slug!"); return; }
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parentId: form.parentId ? parseInt(form.parentId) : undefined,
        isActive: form.isActive,
      };
      if (isEditMode) {
        await adminService.updateCategory(editId, payload);
        showToast("Đã cập nhật danh mục!");
      } else {
        await adminService.createCategory(payload);
        showToast("Đã tạo danh mục!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      showToast(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa danh mục này?")) return;
    try {
      await adminService.deleteCategory(id);
      showToast("Đã xóa!");
      fetchCategories();
    } catch (error) {
      showToast(`Lỗi: ${error.message}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const Pagination = () => totalPages <= 1 ? null : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid #2a2a2a" }}>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>Trang {page} / {totalPages} — {total} danh mục</span>
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
          {isEditMode ? "SỬA DANH MỤC" : "THÊM DANH MỤC MỚI"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Tên danh mục *</label>
            <input name="name" value={form.name} onChange={handleInputChange}
              placeholder="VD: Whey Protein"
              style={inputStyle(false)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Slug *</label>
            <input name="slug" value={form.slug} onChange={handleInputChange}
              placeholder="VD: whey-protein"
              style={inputStyle(false)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--gray)" }}>Danh mục cha</label>
            <select name="parentId" value={form.parentId} onChange={handleInputChange}
              style={{ ...inputStyle(false), cursor: "pointer" }}>
              <option value="">— Không có —</option>
              {categories.filter(c => !c.parentId && c.id !== editId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" name="isActive" id="isActiveCheck" checked={form.isActive} onChange={handleInputChange}
              style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }} />
            <label htmlFor="isActiveCheck" style={{ fontSize: 14, cursor: "pointer" }}>Hoạt động (hiển thị trên web)</label>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline" style={{ padding: "10px 24px" }} onClick={() => setShowModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Tạo danh mục"}
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
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>DANH MỤC</span>
        </h2>
        <div>
          <button className="btn-outline" style={{ marginRight: 12, padding: "10px 20px" }} onClick={handleBack}>← Quay lại</button>
          <button className="btn-primary" style={{ padding: "10px 20px" }} onClick={handleOpenAdd}>+ Thêm Danh Mục</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8 }}>
          <span>🔍</span>
          <input
            placeholder="Tìm tên danh mục..."
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
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Tên</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Slug</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Danh mục cha</th>
                <th style={{ padding: "12px 20px", textAlign: "center", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Trạng thái</th>
                <th style={{ padding: "12px 20px", textAlign: "center", color: "var(--gray)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--gray)" }}>
                    Đang tải...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--gray)" }}>
                    Chưa có danh mục nào.
                  </td>
                </tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: "1px solid #222", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a2e"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 20px", color: "var(--gray)" }}>#{cat.id}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: "14px 20px", color: "var(--gray)", fontFamily: "monospace", fontSize: 13 }}>{cat.slug}</td>
                  <td style={{ padding: "14px 20px", color: "var(--gray)" }}>
                    {cat.parentId ? (categories.find(c => c.id === cat.parentId)?.name || `#${cat.parentId}`) : "—"}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: cat.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: cat.isActive ? "var(--green)" : "var(--red)",
                    }}>
                      {cat.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 12, marginRight: 8 }}
                      onClick={() => handleOpenEdit(cat)}>Sửa</button>
                    <button className="btn-outline" style={{ padding: "6px 14px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }}
                      onClick={() => handleDelete(cat.id)}>Xóa</button>
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

export default CategoryManagePage;
