/**
 * hooks/useApiError.ts
 *
 * API so'rovlarida keladigan xatolarni standart tarzda qayta ishlash.
 * 28 ta joyda takrorlanayotgan:
 *   onError: (e: any) => toast.error(e.response?.data?.message || "Xato")
 * ... o'rniga shu hook ishlatiladi.
 */
import toast from "react-hot-toast";

/**
 * Axios xatosidan foydalanuvchiga ko'rsatiladigan xabar oladi.
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Xatolik yuz berdi",
): string => {
  if (!error) return fallback;
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === "string" && msg.length > 0 && msg.length < 300
    ? msg
    : fallback;
};

/**
 * useMutation onError callback uchun qulay wrapper.
 *
 * @example
 * const freeMutation = useMutation({
 *   mutationFn: () => tableApi.free(table.id),
 *   onError: onMutationError("Stol bo'shatilmadi"),
 * });
 */
export const onMutationError =
  (fallback = "Xatolik yuz berdi") =>
  (error: unknown) => {
    toast.error(getErrorMessage(error, fallback));
  };
