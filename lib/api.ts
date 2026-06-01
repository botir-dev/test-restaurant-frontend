import axios from "axios";

const getStore = () => {
  const { useAuthStore } = require("@/store/auth.store");
  return useAuthStore.getState();
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // cookie cross-origin yuboriladi
});

// ─── Request interceptor — token memory dan ──────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStore().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — 401 da refresh ───────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const clearAuth = () => {
  deleteCookie("refresh_token");
  deleteCookie("user_role");
  deleteCookie("is_authenticated");
  localStorage.removeItem("auth-storage");
  getStore().logout();
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        })
        .catch((e) => Promise.reject(e));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // withCredentials=true bo'lgani uchun cookie avtomatik ketadi
      // body da refresh_token shart emas — backend cookie dan oladi
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { access_token } = res.data.data;

      getStore().setAccessToken(access_token);

      original.headers.Authorization = `Bearer ${access_token}`;
      processQueue(null, access_token);

      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
