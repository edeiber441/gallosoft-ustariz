import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="px-5 pt-[88px] pb-24 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {children}
      </main>
      <BottomNav />
    </>
  );
}