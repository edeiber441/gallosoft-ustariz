import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import SessionGuard from "@/components/SessionGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionGuard />
      <TopNav />
      <main className="px-5 pt-[88px] pb-24 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {children}
      </main>
      <BottomNav />
    </>
  );
}