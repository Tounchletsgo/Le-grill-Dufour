import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votre avis — Le Grill Dufour",
  robots: "noindex, nofollow",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
