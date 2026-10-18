import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/AuthForms";
import { getViewer } from "@/server/auth";

export const metadata: Metadata = { title: "Нэвтрэх", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (await getViewer()) redirect(safe || "/");
  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-12 sm:py-16">
      <div>
        <p className="eyebrow">Тавтай морил</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">Нэвтрэх</h1>
        <p className="mt-2 text-ink-2">Хадгалсан бизнесүүд, захиалгууд болон бизнесийн удирдлагадаа нэвтэрнэ үү.</p>
      </div>
      <div className="card p-5 sm:p-6">
        <LoginForm next={safe} />
      </div>
    </div>
  );
}
