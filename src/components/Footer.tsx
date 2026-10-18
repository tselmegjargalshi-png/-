import Link from "next/link";
import { Logo } from "./ui/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface-2/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-3">
            Монгол даяарх орон нутгийн бизнесийг нэг дороос олж, холбогдож, цаг захиална.
          </p>
        </div>
        <FooterCol title="Судлах">
          <Link href="/">Бизнес хайх</Link>
          <Link href="/angilal/kafe">Кафе</Link>
          <Link href="/angilal/goo-saikhan">Гоо сайхан</Link>
          <Link href="/angilal/zochid-buudal">Зочид буудал</Link>
        </FooterCol>
        <FooterCol title="Бизнес эзэмшигчид">
          <Link href="/biznes-burtguuleh">Бизнесээ бүртгүүлэх</Link>
          <Link href="/biznes">Бизнесийн самбар</Link>
          <Link href="/tukhai">Бидний тухай</Link>
        </FooterCol>
        <FooterCol title="Хэрэглэгч">
          <Link href="/nevtreh">Нэвтрэх</Link>
          <Link href="/burtgel">Бүртгүүлэх</Link>
          <Link href="/hereglegch?tab=hadgalsan">Хадгалсан</Link>
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-3">© {new Date().getFullYear()} NOMAD BUSINESS. Сайт дээрх бизнесүүд бүгд зохиомол, танилцуулгын зорилготой.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <p className="eyebrow mb-4">{title}</p>
      <div className="flex flex-col gap-2.5 text-sm text-ink-2 [&>a:hover]:text-ink [&>a]:w-fit">{children}</div>
    </nav>
  );
}
