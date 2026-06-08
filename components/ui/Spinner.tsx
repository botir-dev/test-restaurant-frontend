import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "green" | "orange" | "white" | "gray";
  className?: string;
}

export function Spinner({
  size = "md",
  color = "green",
  className,
}: SpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  const colors = {
    green: "border-green-600",
    orange: "border-orange-500",
    white: "border-white",
    gray: "border-gray-400",
  };

  return (
    <div
      className={clsx(
        "border-2 border-t-transparent rounded-full animate-spin",
        sizes[size],
        colors[color],
        className,
      )}
    />
  );
}

/** To'liq ekranni qoplovchi loading */
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <Spinner size="lg" color="green" />
    </div>
  );
}

/** Komponent ichida markazlashgan loading */
export function LoadingCenter({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner size="md" color="green" />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
