import clsx from "clsx";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "amber" | "red" | "blue" | "gray" | "purple";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  color = "green",
  size = "sm",
  className,
}: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        colors[color],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Buyurtma holati uchun maxsus badge */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium",
        ORDER_STATUS_COLORS[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
