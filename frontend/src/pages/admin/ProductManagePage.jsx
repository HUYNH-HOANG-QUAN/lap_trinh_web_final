import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/adminService";

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const EMPTY_FORM = {
  sku: "", slug: "", name: "", shortDescription: "", description: "",
  price: 0, oldPrice: 0, stockQuantity: 0, categoryId: null, isActive: true
};

const PAGE_LIMIT = 20;

const ProductManagePage = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter / sort / page state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState(""); // "" | "low" | "ok"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: PAGE_LIMIT,
        sortBy,
        sortDir,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.categoryId = categoryFilter;
      if (stockFilter) params.stockFilter = stockFilter;

      const prodResult = await adminService.getAllProducts(params);
      const catResult = await adminService.getAllCategories();
      const list = prodResult?.data || prodResult || [];
      setProducts(list);
      setTotal(prodResult?.total || list.length);
      setCategories(catResult?.data || catResult || []);
    } catch (error) {
      showToast(`Lỗi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, stockFilter, sortBy, sortDir, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setSortBy(field); setSortDir("ASC"); }
    setPage(1);
  };

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleCategoryFilter = (val) => { setCategoryFilter(val); setPage(1); };
  const handleStockFilter = (val) => { setStockFilter(val); setPage(1); };

  const openAdd = () => { setEditProductId(null); setForm(EMPTY_FORM); setShowModal(true); };

  const openEdit = (p) => {
    setEditProductId(p.id);
    setForm({
      sku: p.sku || "", slug: p.slug || "", name: p.name || "",
      shortDescription: p.shortDescription || "", description: p.description || "",
      price: p.price || 0, oldPrice: p.oldPrice || 0,
      stockQuantity: p.stockQuantity || 0,
      categoryId: p.categoryId || "", isActive: p.isActive !== false
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || form.price === "") {
      showToast("Vui lòng điền đủ SKU, Tên, Giá!");
      return;
    }
    try {
      setIsSubmitting(true);
      if (editProductId) {
        await adminService.updateProduct(editProductId, form);
        showToast("Đã cập nhật sản phẩm!");
      } else {
        await adminService.createProduct(form);
        showToast("Đã thêm sản phẩm mới!");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      showToast(`Lỗi khi lưu: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await adminService.deleteProduct(id);
      showToast("Đã xóa sản phẩm!");
      fetchData();
    } catch (error) {
      showToast(`Lỗi khi xóa: ${error.message}`);
    }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return " ↕";
    return sortDir === "ASC" ? " ↑" : " ↓";
  };

  const Th = ({ field, children, style }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ cursor: "pointer", userSelect: "none", padding: "14px 16px", textAlign: "left", color: sortBy === field ? "var(--primary)" : "var(--gray)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap", ...style }}
    >
      {children}{sortIcon(field)}
    </th>
  );

  const Pagination = () => totalPages <= 1 ? null : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid #2a2a2a" }}>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>
        Trang {page} / {totalPages} — {total} sản phẩm
      </span>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>SẢN PHẨM</span>
        </h2>
        <button className="btn-primary" style={{ padding: "12px 24px" }} onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8 }}>
          <span>🔍</span>
          <input
            placeholder="Tìm theo tên, SKU..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => handleCategoryFilter(e.target.value)}
          style={{ background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 14, outline: "none", minWidth: 160 }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={stockFilter}
          onChange={e => handleStockFilter(e.target.value)}
          style={{ background: "var(--card-bg)", border: "1px solid #333", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 14, outline: "none", minWidth: 160 }}
        >
          <option value="">Tất cả tồn kho</option>
          <option value="low">Sắp hết (&lt;50)</option>
          <option value="ok">Còn hàng</option>
        </select>
        <span style={{ color: "var(--gray)", fontSize: 13, alignSelf: "center" }}>{total} sản phẩm</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a", background: "var(--dark3)" }}>
                <Th field="id">ID</Th>
                <Th field="name">Sản phẩm</Th>
                <Th field="sku">SKU</Th>
                <Th field="categoryId">Danh mục</Th>
                <Th field="price">Giá</Th>
                <Th field="stockQuantity">Tồn kho</Th>
                <Th field="isActive">Trạng thái</Th>
                <th style={{ padding: "14px 16px", color: "var(--gray)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Đang tải dữ liệu...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Không có sản phẩm nào.</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "14px 16px", color: "var(--gray)", fontSize: 12 }}>#{p.id}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "var(--white)", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>Slug: {p.slug}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--gray)", fontFamily: "monospace" }}>{p.sku}</td>
                  <td style={{ padding: "14px 16px", color: "var(--gray)" }}>{p.categoryName || "—"}</td>
                  <td style={{ padding: "14px 16px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--primary)" }}>
                    {formatPrice(p.price)}
                    {p.oldPrice > 0 && <div style={{ fontSize: 12, textDecoration: "line-through", color: "var(--gray)", fontFamily: "Inter, sans-serif" }}>{formatPrice(p.oldPrice)}</div>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.stockQuantity >= 50 ? "var(--green)" : p.stockQuantity > 0 ? "var(--amber)" : "var(--red)" }}>
                      {p.stockQuantity >= 50 ? `Còn ${p.stockQuantity}` : p.stockQuantity > 0 ? `⚠ ${p.stockQuantity}` : "Hết hàng"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: p.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: p.isActive ? "#10b981" : "#ef4444",
                      border: `1px solid ${p.isActive ? "#10b981" : "#ef4444"}`
                    }}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={{ background: "var(--dark3)", border: "1px solid #444", color: "var(--white)", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Sửa</button>
                      <button onClick={() => handleDelete(p.id)} className="btn-danger">Xóa</button>
                    </div>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--dark2)", borderRadius: 20, padding: 36, width: 600, border: "1px solid #333", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, marginBottom: 24, letterSpacing: 1 }}>
              {editProductId ? "CHỈNH SỬA SẢN PHẨM" : "THÊM SẢN PHẨM MỚI"}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm *</label>
                  <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input required className="form-input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input required className="form-input" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-input" value={form.categoryId || ""} onChange={e => setForm({...form, categoryId: e.target.value ? Number(e.target.value) : null})}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá (đ) *</label>
                  <input required type="number" className="form-input" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá cũ (đ)</label>
                  <input type="number" className="form-input" value={form.oldPrice} onChange={e => setForm({...form, oldPrice: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tồn kho</label>
                  <input type="number" className="form-input" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: Number(e.target.value)})} />
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "center", paddingTop: 30 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--white)" }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                    Đang hoạt động
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <input className="form-input" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, padding: "13px 0" }}>
                  {isSubmitting ? "Đang xử lý..." : (editProductId ? "Lưu thay đổi" : "Thêm sản phẩm")}
                </button>
                <button type="button" className="btn-outline" style={{ flex: 1, padding: "13px 0" }} onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagePage;
