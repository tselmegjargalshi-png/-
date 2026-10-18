import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/AuthForms";
import { getViewer } from "@/server/auth";

export const metadata: Metadata = { title: "Бүртгүүлэх", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; role?: string }> }) {
  const { next, role } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (await getViewer()) redirect(safe || "/");
  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-12 sm:py-16">
      <div>
        <p className="eyebrow">Шинэ бүртгэл</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">Бүртгүүлэх</h1>
        <p className="mt-2 text-ink-2">Минутын дотор бүртгүүлж, цаг захиалж эсвэл бизнесээ нэмээрэй.</p>
      </div>
      <div className="card p-5 sm:p-6">
        <RegisterForm next={safe} defaultRole={role === "OWNER" ? "OWNER" : "USER"} />
      </div>
    </div>
  );
}
