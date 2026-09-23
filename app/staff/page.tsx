import type { Metadata } from "next";
import KitchenBoard from "@/components/staff/KitchenBoard";

export const metadata: Metadata = {
  title: "Staff",
  robots: "noindex, nofollow",
};

export default function StaffPage() {
  return <KitchenBoard />;
}
