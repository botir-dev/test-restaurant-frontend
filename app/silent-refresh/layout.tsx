import { Suspense } from "react";

export default function SilentRefreshLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
