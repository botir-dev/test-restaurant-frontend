// Background Sync — internet qaytganda pending amallarni yuborish
import api from "./api/client";
import {
  getPendingActions,
  updatePendingAction,
  deletePendingAction,
  type PendingAction,
} from "./offline-db";

const MAX_RETRIES = 3;

// ─── Har bir amal turini backend ga yuborish ──────────────────
const executeAction = async (action: PendingAction): Promise<void> => {
  const { type, payload } = action;

  switch (type) {
    case "create_order":
      await api.post("/orders", payload);
      break;
    case "update_order":
      await api.patch(`/orders/${payload.orderId}`, payload.data);
      break;
    case "prepare_item":
      await api.patch(
        `/orders/${payload.orderId}/items/${payload.itemId}/prepare`,
      );
      break;
    case "complete_payment":
      await api.post(`/payments/${payload.orderId}`, {
        payment_type: payload.payment_type,
      });
      break;
    default:
      throw new Error(`Noma'lum amal turi: ${type}`);
  }
};

// ─── Barcha pending amallarni sync qilish ────────────────────
export const syncPendingActions = async (): Promise<{
  synced: number;
  failed: number;
}> => {
  const actions = await getPendingActions();
  const pending = actions.filter((a) => a.status !== "failed");

  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of pending) {
    try {
      await updatePendingAction(action.id, { status: "syncing" });
      await executeAction(action);
      await deletePendingAction(action.id);
      synced++;
    } catch (err) {
      const newRetries = action.retries + 1;
      if (newRetries >= MAX_RETRIES) {
        await updatePendingAction(action.id, {
          status: "failed",
          retries: newRetries,
        });
        failed++;
      } else {
        await updatePendingAction(action.id, {
          status: "pending",
          retries: newRetries,
        });
      }
    }
  }

  return { synced, failed };
};

// ─── Online bo'lganda avtomatik sync ─────────────────────────
export const startAutoSync = (
  onSync?: (result: { synced: number; failed: number }) => void,
) => {
  const handleOnline = async () => {
    // 2 soniya kutamiz — ulanish barqarorlashsin
    await new Promise((r) => setTimeout(r, 2000));
    const result = await syncPendingActions();
    if (result.synced > 0 || result.failed > 0) {
      onSync?.(result);
    }
  };

  window.addEventListener("online", handleOnline);

  // Sahifa ochilganda ham online bo'lsa sync qilish
  if (navigator.onLine) {
    syncPendingActions().then((result) => {
      if (result.synced > 0 || result.failed > 0) {
        onSync?.(result);
      }
    });
  }

  // Tozalash funksiyasi
  return () => window.removeEventListener("online", handleOnline);
};
