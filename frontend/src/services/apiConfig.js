// Cấu hình Base URL cho Backend (Có thể overide bằng biến môi trường VITE_API_BASE_URL trong file .env)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://protech-backend-1qu3.onrender.com/api/v1';

// Các cấu hình chung cho fetch
export const getDefaultHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};
