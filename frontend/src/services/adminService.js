import { API_BASE_URL, getDefaultHeaders } from './apiConfig';

const ADMIN_API_URL = `${API_BASE_URL}/admin`;

const authHeadersNoJson = () => {
    const token = localStorage.getItem("token");
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const adminService = {
    /**
     * Lấy danh sách tất cả người dùng
     * GET /admin/user/all
     */
    getAllUsers: async (page = 0, size = 10) => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/user/all?page=${page}&size=${size}`, {
                method: 'GET',
                headers: getDefaultHeaders(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch users');
            }
            return await response.json();
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    },

    /**
     * Thêm mới người dùng
     * POST /admin/user/add
     */
    createUser: async (userData) => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/user/add`, {
                method: 'POST',
                headers: getDefaultHeaders(),
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create user');
            }
            return await response.json(); // Trả về UserResponse
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin người dùng
     * PUT /admin/user/{id}
     */
    updateUser: async (id, userData) => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/user/${id}`, {
                method: 'PUT',
                headers: getDefaultHeaders(),
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update user');
            }
            return await response.json(); // Trả về UserResponse
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/user/${id}`, {
                method: 'DELETE',
                headers: getDefaultHeaders(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete user');
            }
            return true;
        } catch (error) {
            console.error('Error in deleteUser:', error);
            throw error;
        }
    },

    // ==========================================
// CATEGORY APIs
// ==========================================
    getAllCategories: async (page = 0, size = 100) => {
        const res = await fetch(`${ADMIN_API_URL}/category/all?page=${page}&size=${size}`, { headers: getDefaultHeaders() });
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },
    createCategory: async (data) => {
        const res = await fetch(`${ADMIN_API_URL}/category/add`, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create category');
        return res.json();
    },
    updateCategory: async (id, data) => {
        const res = await fetch(`${ADMIN_API_URL}/category/${id}`, {
            method: 'PUT',
            headers: getDefaultHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
    },
    deleteCategory: async (id) => {
        const res = await fetch(`${ADMIN_API_URL}/category/${id}`, {
            method: 'DELETE',
            headers: getDefaultHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete category');
        return true;
    },

    // ==========================================
    // PRODUCT APIs
    // ==========================================
    getAllProducts: async (page = 0, size = 10, filters = {}) => {
        // filters: { keyword?, minPrice?, maxPrice? }
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(size));
        if (filters.keyword) params.set("keyword", String(filters.keyword));
        if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== "") {
            params.set("minPrice", String(filters.minPrice));
        }
        if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== "") {
            params.set("maxPrice", String(filters.maxPrice));
        }
        const res = await fetch(`${ADMIN_API_URL}/product/all?${params.toString()}`, { headers: getDefaultHeaders() });
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },
    /**
     * Upload 1 ảnh sản phẩm (multipart/form-data, field "image")
     * Trả về { imageUrl, filename, size, mimetype }
     */
    uploadProductImage: async (file) => {
        if (!file) throw new Error("Chưa chọn file ảnh.");
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`${ADMIN_API_URL}/upload/product-image`, {
            method: "POST",
            headers: authHeadersNoJson(),
            body: formData,
        });
        if (!res.ok) {
            let errMsg = "Upload ảnh thất bại";
            try {
                const txt = await res.text();
                if (txt) errMsg = txt;
            } catch {}
            throw new Error(errMsg);
        }
        return res.json();
    },
    createProduct: async (data) => {
        const res = await fetch(`${ADMIN_API_URL}/product/add`, {
            method: 'POST',
            headers: getDefaultHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create product');
        return res.json();
    },
    updateProduct: async (id, data) => {
        const res = await fetch(`${ADMIN_API_URL}/product/${id}`, {
            method: 'PUT',
            headers: getDefaultHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update product');
        return res.json();
    },
    deleteProduct: async (id) => {
        const res = await fetch(`${ADMIN_API_URL}/product/${id}`, {
            method: 'DELETE',
            headers: getDefaultHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return true;
    },

    // ==========================================
    // ORDER APIs
    // ==========================================
    getAllOrders: async (page = 0, size = 10) => {
        const res = await fetch(`${ADMIN_API_URL}/order/all?page=${page}&size=${size}`, { headers: getDefaultHeaders() });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },
    getOrderById: async (id) => {
        const res = await fetch(`${ADMIN_API_URL}/order/${id}`, { headers: getDefaultHeaders() });
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
    },
    updateOrderStatus: async (id, data) => {
        const res = await fetch(`${ADMIN_API_URL}/order/${id}/status`, {
            method: 'PUT',
            headers: getDefaultHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update order status');
        return res.json();
    },

    // DASHBOARD STATS API
    getDashboardStats: async () => {
        const res = await fetch(`${ADMIN_API_URL}/dashboard/stats`, { headers: getDefaultHeaders() });
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
    },

    // NOTIFICATION APIs
    /*
     * Lấy tất cả thông báo chưa đọc cho admin
     * Bao gồm: tin nhắn liên hệ + đơn hàng chờ xác nhận
     */
    getAllNotifications: async () => {
        const res = await fetch(`${ADMIN_API_URL}/notifications`, {
            headers: getDefaultHeaders()
        });
        if (!res.ok) throw new Error('Failed to get notifications');
        return res.json();
    },
};
