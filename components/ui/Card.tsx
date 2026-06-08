import { type HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Padding variant */
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  children,
  padding = "md",
  hover = false,
  className,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-gray-100 shadow-sm",
        paddings[padding],
        hover && "hover:shadow-md transition-shadow duration-150 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
