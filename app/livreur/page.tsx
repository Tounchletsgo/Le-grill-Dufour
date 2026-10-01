import type { Metadata } from "next";
import DriverBoard from "@/components/driver/DriverBoard";

export const metadata: Metadata = {
  title: "Livreur",
  robots: "noindex, nofollow",
};

export default function DriverPage() {
  return <DriverBoard />;
}
