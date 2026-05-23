// Har bir funksiya: avval online urinib ko'radi,
// muvaffaqiyatsiz bo'lsa offline ga yozadi
import api from "./api";
import { addPendingAction } from "./offline-db";
import { v4 as uuidv4 } from "uuid";

// ─── BUYURTMA YARATISH ────────────────────────────────────────
export const createOrderOffline = async (payload: {
  table_id: string;
  guest_count: number;
  items: { product_id: string; quantity: number }[];
  waiter_id?: string;
}) => {
  if (navigator.onLine) {
    try {
      const res = await api.post("/orders", payload);
      return { success: true, data: res.data.data, offline: false };
    } catch (err: any) {
      // Server xatosi — offline ga yozmaymiz (validatsiya xatosi bo'lishi mumkin)
      if (err.response?.status && err.response.status < 500) throw err;
    }
  }

  // Offline: local ID bilan saqlaymiz
  const tempId = `offline_${uuidv4()}`;
  await addPendingAction({
    type: "create_order",
    payload: { ...payload, tempId },
  });

  return {
    success: true,
    offline: true,
    tempId,
    data: {
      id: tempId,
      status: "pending",
      items: payload.items,
      table_id: payload.table_id,
      guest_count: payload.guest_count,
      created_at: new Date().toISOString(),
    },
  };
};

// ─── ITEM TAYYORLANDI BELGILASH ───────────────────────────────
export const prepareItemOffline = async (orderId: string, itemId: string) => {
  if (navigator.onLine) {
    try {
      const res = await api.patch(`/orders/${orderId}/items/${itemId}/prepare`);
      return { success: true, data: res.data.data, offline: false };
    } catch (err: any) {
      if (err.response?.status && err.response.status < 500) throw err;
    }
  }

  await addPendingAction({
    type: "prepare_item",
    payload: { orderId, itemId },
  });

  return { success: true, offline: true };
};

// ─── TO'LOV QABUL QILISH ─────────────────────────────────────
export const completePaymentOffline = async (
  orderId: string,
  paymentType: "cash" | "card" | "qr_payment",
) => {
  if (navigator.onLine) {
    try {
      const res = await api.post(`/payments/${orderId}/pay`, {
        payment_type: paymentType,
      });
      return { success: true, data: res.data.data, offline: false };
    } catch (err: any) {
      if (err.response?.status && err.response.status < 500) throw err;
    }
  }

  await addPendingAction({
    type: "complete_payment",
    payload: { orderId, payment_type: paymentType },
  });

  return { success: true, offline: true };
};

// ─── BUYURTMA YANGILASH ───────────────────────────────────────
export const updateOrderOffline = async (
  orderId: string,
  data: Record<string, unknown>,
) => {
  if (navigator.onLine) {
    try {
      const res = await api.patch(`/orders/${orderId}`, data);
      return { success: true, data: res.data.data, offline: false };
    } catch (err: any) {
      if (err.response?.status && err.response.status < 500) throw err;
    }
  }

  await addPendingAction({
    type: "update_order",
    payload: { orderId, data },
  });

  return { success: true, offline: true };
};
