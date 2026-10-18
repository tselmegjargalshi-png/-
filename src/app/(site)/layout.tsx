import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { getViewer } from "@/server/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <>
      <Header />
      <main id="main" className="min-h-[70dvh] pb-20 lg:pb-0">
        {children}
      </main>
      <Footer />
      <MobileNav viewer={viewer} />
    </>
  );
}
