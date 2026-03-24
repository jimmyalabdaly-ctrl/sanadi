import { Header } from "@/components/layout/header";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-warm-50">{children}</main>
    </div>
  );
}
