import Link from "next/link";
import { getViewer } from "@/server/auth";
import { Logo } from "./ui/Logo";
import { UserMenu } from "./UserMenu";

export async function Header({ variant = "solid" }: { variant?: "solid" | "bar" }) {
  const viewer = await getViewer();
  return (
    <header
      className={
        variant === "bar"
          ? "relative z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-bg px-4 lg:px-6"
          : "sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg/95 px-4 backdrop-blur lg:px-8"
      }
    >
      <span className="sm:hidden"><Logo compact /></span>
      <span className="hidden sm:block"><Logo /></span>
      <nav aria-label="Үндсэн цэс" className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink md:block">
          Бизнес хайх
        </Link>
        <Link href="/tukhai" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink md:block">
          Бидний тухай
        </Link>
        <Link href={viewer ? "/biznes-burtguuleh" : "/burtgel?role=OWNER&next=/biznes-burtguuleh"} className="btn btn-primary btn-sm">
          <span className="hidden sm:inline">Бизнесээ бүртгүүлэх</span>
          <span className="sm:hidden">Бизнес нэмэх</span>
        </Link>
        {viewer ? (
          <UserMenu viewer={viewer} />
        ) : (
          <Link href="/nevtreh" className="btn btn-ghost btn-sm">
            Нэвтрэх
          </Link>
        )}
      </nav>
    </header>
  );
}
