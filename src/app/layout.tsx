import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanadi - سَنَدي | Your Home, Handled",
  description: "Jordan's leading home services marketplace. Find trusted, verified professionals for plumbing, electrical, painting, cleaning, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
