
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isOwnerAuthenticated } from "@/lib/auth";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isOwner = await isOwnerAuthenticated();

  if (!isOwner) {
    redirect("/login");
  }

  return children;
}
