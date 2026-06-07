// admin.js — ProFit Admin Panel (Node.js/Express backend)

const API_BASE = '';
const TOKEN_KEY = 'profit_admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const Utils = {
  formatCurrency(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
  },
  statusBadge(s) {
    const map = {
      'COMPLETED': ['badge-success', '✓ Hoàn thành'],
      'PENDING': ['badge-warning', '⏳ Chờ xử lý'],
      'CONFIRMED': ['badge-info', '✓ Đã xác nhận'],
      'SHIPPED': ['badge-info', '🚚 Đang giao'],
      'DELIVERED': ['badge-success', '📦 Đã giao'],
      'CANCELLED': ['badge-danger', '✗ Đã hủy'],
    };
    const [cls, lbl] = map[s] || ['badge-gray', s];
    return `<span class="badge ${cls}">${lbl}</span>`;
  },
  orderStatusBadge(s) {
    return this.statusBadge(s);
  },
  paymentBadge(s) {
    const map = {
      'UNPAID': ['badge-warning', 'Chưa thanh toán'],
      'PENDING_CONFIRM': ['badge-info', 'Chờ xác nhận'],
      'PAID': ['badge-success', 'Đã thanh toán'],
      'FAILED': ['badge-danger', 'Thanh toán thất bại'],
    };
    const [cls, lbl] = map[s] || ['badge-gray', s];
    return `<span class="badge ${cls}">${lbl}</span>`;
  },
  roleBadge(r) {
    return String(r || '').toUpperCase() === 'ADMIN'
      ? `<span class="badge badge-purple">👑 Admin</span>`
      : `<span class="badge badge-info">👤 User</span>`;
  },
  userStatusBadge(s) {
    return String(s || '').toUpperCase() === 'ACTIVE'
      ? `<span class="badge badge-success">● Active</span>`
      : `<span class="badge badge-danger">● Inactive</span>`;
  },
  stars(avg) {
    avg = parseFloat(avg) || 0;
    const f = Math.floor(avg);
    const s = '★'.repeat(f) + '☆'.repeat(5 - f);
    return `<span class="stars">${s}</span> <small style="color:var(--text-muted);font-size:11px">${avg.toFixed(1)}</small>`;
  },
  toast(msg, type = 'success') {
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container';
      document.body.appendChild(c);
    }
    const t = document.createElement('div');
    const icons = { success: '✓', error: '✗', warn: '⚠' };
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || '✓'}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3000);
  },
};

// ── API LAYER ──────────────────────────────────────────────
const API = {
  _h() {
    return {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    };
  },

  async _req(method, url, body) {
    const opts = { method, headers: this._h(), credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + url, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ── AUTH ──────────────────────────────────────────────────
  async login(username, password, rememberMe) {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.token) setToken(data.token);
    return data;
  },

  async logout() {
    clearToken();
    await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
  },

  // ── USERS ─────────────────────────────────────────────────
  async getUsers() { return this._req('GET', '/admin/user/all'); },
  async createUser(d) { return this._req('POST', '/admin/user/add', d); },
  async updateUser(id, d) { return this._req('PUT', `/admin/user/${id}`, d); },
  async deleteUser(id) { return this._req('DELETE', `/admin/user/${id}`); },

  // ── CATEGORIES ────────────────────────────────────────────
  async getCategories() { return this._req('GET', '/admin/category/all'); },
  async createCategory(d) { return this._req('POST', '/admin/category/add', d); },
  async updateCategory(id, d) { return this._req('PUT', `/admin/category/${id}`, d); },
  async deleteCategory(id) { return this._req('DELETE', `/admin/category/${id}`); },

  // ── PRODUCTS ───────────────────────────────────────────────
  async getProducts() { return this._req('GET', '/admin/product/all'); },
  async createProduct(d) { return this._req('POST', '/admin/product/add', d); },
  async updateProduct(id, d) { return this._req('PUT', `/admin/product/${id}`, d); },
  async deleteProduct(id) { return this._req('DELETE', `/admin/product/${id}`); },

  // ── ORDERS ────────────────────────────────────────────────
  async getOrders() { return this._req('GET', '/admin/order/all'); },
  async getOrderById(id) { return this._req('GET', `/admin/order/${id}`); },
  async updateOrderStatus(id, status, paymentStatus) {
    return this._req('PUT', `/admin/order/${id}/status`, { status, paymentStatus });
  },

  // ── DASHBOARD ─────────────────────────────────────────────
  async getDashboardStats() { return this._req('GET', '/admin/dashboard/stats'); },

  // ── REVIEWS ───────────────────────────────────────────────
  async getReviews() {
    return this._req('GET', '/api/reviews/product/0').catch(() => []);
  },

  // ── MESSAGES ──────────────────────────────────────────────
  async getMessages() { return this._req('GET', '/api/messages/admin/all'); },
  async replyMessage(id, replyContent) {
    return this._req('POST', `/api/messages/admin/${id}/reply`, { replyContent });
  },
  async markRead(id) { return this._req('POST', `/api/messages/admin/${id}/read`); },
  async getUnreadCount() { return this._req('GET', '/api/messages/admin/unread-count'); },

  // ── BANKING ───────────────────────────────────────────────
  async confirmBanking(orderId, bankTransferSlip) {
    return this._req('POST', `/api/v1/banking/confirm/${orderId}`, { bankTransferSlip });
  },
  async getPendingCount() { return this._req('GET', '/api/v1/banking/pending-count'); },
};

// ── DELETE CONFIRM ───────────────────────────────────────────
const DeleteConfirm = {
  _timer: null, _cb: null,
  show(label, onConfirm) {
    this._cb = onConfirm;
    const overlay = document.getElementById('deleteModalOverlay');
    const btn = document.getElementById('confirmDeleteBtn');
    const fill = document.getElementById('countdownFill');
    const lbl = document.getElementById('countdownLabel');
    const target = document.getElementById('deleteTargetLabel');
    if (!overlay) return;
    target.textContent = label;
    btn.disabled = true;
    fill.style.transition = 'none'; fill.style.width = '100%';
    lbl.textContent = 'Vui lòng chờ 10 giây...';
    overlay.classList.add('open');
    let count = 10;
    setTimeout(() => { fill.style.transition = `width ${count}s linear`; fill.style.width = '0%'; }, 60);
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      count--;
      lbl.textContent = count > 0 ? `Vui lòng chờ ${count} giây...` : 'Bạn có thể xác nhận xóa bây giờ';
      if (count <= 0) { clearInterval(this._timer); btn.disabled = false; }
    }, 1000);
  },
  hide() {
    clearInterval(this._timer);
    const overlay = document.getElementById('deleteModalOverlay');
    if (overlay) overlay.classList.remove('open');
  },
  confirm() { if (this._cb) this._cb(); this.hide(); },
};

// ── MODAL HELPERS ───────────────────────────────────────────
const Modal = {
  open(id) { const el = document.getElementById(id); if (el) el.classList.add('open'); },
  close(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); },
  closeAll() { document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open')); },
};

// ── LOGOUT ──────────────────────────────────────────────────
function logout() {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  closeLogoutDropdown();
  API.logout().then(() => {
    Utils.toast('Đã đăng xuất thành công', 'success');
    setTimeout(() => { window.location.href = '/admin/login'; }, 300);
  }).catch(() => {
    Utils.toast('Không thể đăng xuất. Vui lòng thử lại.', 'error');
  });
}

function toggleLogoutDropdown() {
  const menu = document.getElementById('logoutDropdown');
  if (!menu) return;
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeLogoutDropdown() {
  const menu = document.getElementById('logoutDropdown');
  if (menu) menu.style.display = 'none';
}

// ── ACTIVE NAV ──────────────────────────────────────────────
function setActiveNav(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay && overlay.id !== 'deleteModalOverlay') {
        overlay.classList.remove('open');
      }
    });
  });

  document.addEventListener('click', e => {
    const dropdown = document.getElementById('logoutDropdown');
    const settingsBtn = document.getElementById('settingsBtn');
    if (!dropdown || !settingsBtn) return;
    if (settingsBtn.contains(e.target) || dropdown.contains(e.target)) return;
    dropdown.style.display = 'none';
  });
});
