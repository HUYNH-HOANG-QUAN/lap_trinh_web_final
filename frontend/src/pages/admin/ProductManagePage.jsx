import { useState, useEffect, useRef } from "react";
import { adminService } from "../../services/adminService";

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const EMPTY_FORM = {
  sku: "", slug: "", name: "", shortDescription: "", description: "",
  price: 0, oldPrice: 0, stockQuantity: 0, categoryId: null, isActive: true,
  imageUrl: "",
};

const PRICE_RANGES = [
  { id: "all", label: "Tất cả", min: "", max: "" },
  { id: "lt-300k", label: "Dưới 300k", min: 0, max: 300000 },
  { id: "300k-500k", label: "300k – 500k", min: 300000, max: 500000 },
  { id: "500k-1m", label: "500k – 1 triệu", min: 500000, max: 1000000 },
  { id: "1m-1.5m", label: "1 – 1.5 triệu", min: 1000000, max: 1500000 },
  { id: "1.5m-2m", label: "1.5 – 2 triệu", min: 1500000, max: 2000000 },
  { id: "gt-2m", label: "Trên 2 triệu", min: 2000000, max: "" },
];

const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

const ProductManagePage = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePriceRange, setActivePriceRange] = useState(PRICE_RANGES[0]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async (page = 0) => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        adminService.getAllProducts(page, pagination.size, {
          keyword: search.trim() || undefined,
          minPrice: activePriceRange.min === "" ? undefined : activePriceRange.min,
          maxPrice: activePriceRange.max === "" ? undefined : activePriceRange.max,
          categoryId: activeCategoryId || undefined,
        }),
        adminService.getAllCategories()
      ]);
      if (prodData.content) {
        setProducts(prodData.content);
        setPagination({
          page: prodData.number,
          size: prodData.size,
          totalElements: prodData.totalElements,
          totalPages: prodData.totalPages
        });
      } else {
        setProducts(prodData);
      }
      setCategories(catData.content ? catData.content : catData);
    } catch (error) {
      showToast(`❌ Lỗi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gọi lại khi filter (search, price range, category) thay đổi - reset về page 0
  useEffect(() => {
    fetchData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activePriceRange, activeCategoryId]);

  const openAdd = () => {
    setEditProductId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProductId(p.id);
    setForm({
      sku: p.sku || "",
      slug: p.slug || "",
      name: p.name || "",
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      price: p.price || 0,
      oldPrice: p.oldPrice || 0,
      stockQuantity: p.stockQuantity || 0,
      categoryId: p.categoryId || "",
      isActive: p.isActive !== false,
      imageUrl: p.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(formatImageUrl(p.imageUrl || ""));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      showToast("⚠️ Vui lòng chọn file ảnh hợp lệ (jpg, png, webp, gif).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("⚠️ File ảnh quá lớn. Tối đa 5MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm({ ...form, imageUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || form.price === "") {
      showToast("⚠️ Vui lòng điền đủ SKU, Tên, Giá!");
      return;
    }
    try {
      setIsSubmitting(true);

      let imageUrl = form.imageUrl || "";
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadRes = await adminService.uploadProductImage(imageFile);
          imageUrl = uploadRes.imageUrl;
        } catch (uploadErr) {
          showToast(`❌ Upload ảnh thất bại: ${uploadErr.message}`);
          setIsSubmitting(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      const payload = { ...form, imageUrl };

      if (editProductId) {
        await adminService.updateProduct(editProductId, payload);
        showToast("✅ Đã cập nhật sản phẩm!");
      } else {
        await adminService.createProduct(payload);
        showToast("✅ Đã thêm sản phẩm mới!");
      }
      closeModal();
      fetchData(pagination.page);
    } catch (error) {
      showToast(`❌ Lỗi khi lưu: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await adminService.deleteProduct(id);
      showToast("🗑 Đã xóa sản phẩm!");
      fetchData(pagination.page);
    } catch (error) {
      showToast(`❌ Lỗi khi xóa: ${error.message}`);
    }
  };

  return (
    <div className="section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2 }}>
          QUẢN LÝ <span style={{ color: "var(--primary)" }}>SẢN PHẨM</span>
        </h2>
        <button className="btn-primary" style={{ padding: "12px 24px" }} onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 240 }}>
          <span>🔍</span>
          <input
            className="search-input"
            placeholder="Tìm theo tên, SKU, slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ color: "var(--gray)", fontSize: 14 }}>{pagination.totalElements || products.length} sản phẩm</span>
      </div>

      {/* Bộ lọc khoảng giá */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <span style={{ color: "var(--gray)", fontSize: 13, alignSelf: "center", marginRight: 4 }}>💰 Giá:</span>
        {PRICE_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => setActivePriceRange(range)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: activePriceRange.id === range.id
                ? "1px solid var(--primary)"
                : "1px solid #333",
              background: activePriceRange.id === range.id
                ? "rgba(255, 92, 0, 0.15)"
                : "var(--dark3)",
              color: activePriceRange.id === range.id ? "var(--primary)" : "var(--gray)",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Bộ lọc danh mục */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <span style={{ color: "var(--gray)", fontSize: 13, alignSelf: "center", marginRight: 4 }}>📂 Danh mục:</span>
        <select
          value={activeCategoryId}
          onChange={e => setActiveCategoryId(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #333",
            background: "var(--dark3)",
            color: activeCategoryId ? "var(--primary)" : "var(--gray)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            outline: "none",
            minWidth: 180,
          }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(activeCategoryId || search || activePriceRange.id !== "all") && (
          <button
            onClick={() => {
              setActiveCategoryId("");
              setSearch("");
              setActivePriceRange(PRICE_RANGES[0]);
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #ef4444",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Đang tải dữ liệu...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--gray)" }}>Không có sản phẩm nào.</div>
        ) : (
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a", background: "var(--dark3)" }}>
                  {["Ảnh", "Sản phẩm", "SKU", "Danh mục", "Giá", "Tồn kho", ""].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--gray)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "10px 16px", width: 70 }}>
                      {p.imageUrl ? (
                        <img
                          src={formatImageUrl(p.imageUrl)}
                          alt={p.name}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid #333" }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--dark3)", border: "1px dashed #444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖼️</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "var(--white)", marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--primary)" }}>Slug: {p.slug}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--gray)" }}>{p.sku}</td>
                    <td style={{ padding: "14px 16px", color: "var(--gray)" }}>{p.categoryName || "—"}</td>
                    <td style={{ padding: "14px 16px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "var(--primary)" }}>
                      {formatPrice(p.price)}
                      {p.oldPrice > 0 && <div style={{ fontSize: 12, textDecoration: "line-through", color: "var(--gray)", fontFamily: "Inter, sans-serif" }}>{formatPrice(p.oldPrice)}</div>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.stockQuantity > 0 ? "var(--green)" : "var(--red)" }}>
                        {p.stockQuantity > 0 ? `Còn ${p.stockQuantity}` : "Hết hàng"}
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
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24, padding: "0 16px 16px" }}>
                <button
                  className="btn-outline"
                  disabled={pagination.page === 0}
                  onClick={() => fetchData(pagination.page - 1)}
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
                  onClick={() => fetchData(pagination.page + 1)}
                  style={{ padding: "8px 16px" }}
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--dark2)", borderRadius: 20, padding: 36, width: 640, border: "1px solid #333", maxHeight: "90vh", overflowY: "auto" }}>
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
                  <input className="form-input" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
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
                    Đang hoạt động (Hiển thị)
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

              {/* Upload ảnh sản phẩm */}
              <div className="form-group">
                <label className="form-label">Ảnh sản phẩm</label>
                <div style={{
                  border: "1px dashed #444",
                  borderRadius: 12,
                  padding: 16,
                  background: "var(--dark3)",
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 110,
                    height: 110,
                    borderRadius: 10,
                    background: "#0f1419",
                    border: "1px solid #2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ color: "var(--gray)", fontSize: 12, textAlign: "center", padding: 8 }}>Chưa có ảnh</span>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                      id="product-image-input"
                    />
                    <label
                      htmlFor="product-image-input"
                      style={{
                        display: "inline-block",
                        padding: "10px 16px",
                        background: "var(--dark4)",
                        border: "1px solid #444",
                        borderRadius: 8,
                        color: "var(--white)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      📁 Chọn ảnh (jpg, png, webp, gif &lt; 5MB)
                    </label>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>
                      {imageFile
                        ? `Đã chọn: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)`
                        : form.imageUrl
                          ? `Ảnh hiện tại: ${form.imageUrl}`
                          : "Chưa chọn ảnh."}
                    </div>
                    {(imagePreview || form.imageUrl) && (
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          background: "transparent",
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600,
                          alignSelf: "flex-start",
                        }}
                      >
                        ✕ Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting || uploadingImage} style={{ flex: 1, padding: "13px 0" }}>
                  {uploadingImage ? "Đang upload ảnh..." : isSubmitting ? "Đang xử lý..." : (editProductId ? "Lưu thay đổi" : "Thêm sản phẩm")}
                </button>
                <button type="button" className="btn-outline" style={{ flex: 1, padding: "13px 0" }} onClick={closeModal}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagePage;
