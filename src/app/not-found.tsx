import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">Хуудас олдсонгүй.</h1>
        <p className="mt-3 text-ink-2">Таны хайсан хуудас байхгүй эсвэл өөр хаяг руу шилжсэн байж магадгүй.</p>
        <Link href="/" className="btn btn-primary mt-6">Нүүр хуудас руу буцах</Link>
      </main>
    </>
  );
}
