import api from "./client";

export const tableApi = {
  getAll: () => api.get("/tables"),
  create: (data: { table_number: number; capacity?: number }) =>
    api.post("/tables", data),
  occupy: (id: string, guest_count: number) =>
    api.patch(`/tables/${id}/occupy`, { guest_count }),
  free: (id: string) => api.patch(`/tables/${id}/free`, {}),

  getReservations: (params?: { date?: string; table_id?: string }) =>
    api.get("/tables/reservations", { params }),
  createReservation: (data: {
    table_id: string;
    full_name: string;
    phone: string;
    reserved_at: string;
    duration_min?: number;
    guest_count?: number;
  }) => api.post("/tables/reservations", data),
  cancelReservation: (id: string) => api.delete(`/tables/reservations/${id}`),
};
