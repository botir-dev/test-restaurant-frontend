import api from "./client";
import type { Restaurant, Branch, Staff, Role, ProductType } from "@/types";

export const adminApi = {
  // Restaurants
  getRestaurants: () => api.get("/admin/restaurants"),
  createRestaurant: (data: {
    name: string;
    address?: string;
    logo_url?: string;
  }) => api.post("/admin/restaurants", data),
  updateRestaurant: (id: string, data: Partial<Restaurant>) =>
    api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id: string) => api.delete(`/admin/restaurants/${id}`),

  // Branches
  getBranches: (restaurant_id?: string) =>
    api.get("/admin/branches", { params: { restaurant_id } }),
  createBranch: (data: {
    restaurant_id: string;
    name: string;
    address?: string;
    phone?: string;
  }) => api.post("/admin/branches", data),
  updateBranch: (id: string, data: Partial<Branch>) =>
    api.put(`/admin/branches/${id}`, data),

  // Managers
  getManagers: (restaurant_id?: string) =>
    api.get("/admin/managers", { params: { restaurant_id } }),
  createManager: (data: {
    restaurant_id: string;
    branch_id: string;
    full_name: string;
    username: string;
    phone?: string;
    password: string;
  }) => api.post("/admin/managers", data),
  updateManager: (id: string, data: Partial<Staff & { password?: string }>) =>
    api.put(`/admin/managers/${id}`, data),
  deleteManager: (id: string) => api.delete(`/admin/managers/${id}`),

  // Owners
  getOwners: (restaurant_id?: string) =>
    api.get("/admin/owners", { params: { restaurant_id } }),
  createOwner: (data: {
    restaurant_id: string;
    full_name: string;
    username: string;
    phone?: string;
    password: string;
  }) => api.post("/admin/owners", data),
  updateOwner: (
    id: string,
    data: { full_name?: string; phone?: string; is_active?: boolean },
  ) => api.put(`/admin/owners/${id}`, data),
  deleteOwner: (id: string) => api.delete(`/admin/owners/${id}`),
};
