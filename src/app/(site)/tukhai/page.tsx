import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Бидний тухай",
  description: "NOMAD BUSINESS нь Монгол даяарх бизнесүүдийг газрын зураг дээрээс олж, цаг захиалах платформ.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="eyebrow">Бидний тухай</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl">Монгол орны бизнесүүд нэг газрын зураг дээр.</h1>
      <div className="mt-8 grid gap-5 text-[17px] leading-[1.75] text-ink-2">
        <p>NOMAD BUSINESS нь кафе, ресторан, гоо сайхан, спорт, гар урлал, үйлчилгээ, фрилансер зэрэг Монгол даяарх бизнесийг нэг дор хайж, газрын зураг дээрээс олж, цагаа шууд захиалах боломжийг олгоно.</p>
        <p>Улаанбаатарын дүүрэг бүр, аймаг бүрийн бизнесийг адил харагдуулах нь бидний зорилго. Хөдөөгийн жижиг бизнес нийслэлийн томоохон брэндтэй ижил тэгш түвшинд танигдах ёстой.</p>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Энэ хувилбарын тухай</h2>
        <p>Одоогийн нийтлэгдсэн хувилбар нь жишээ өгөгдөлтэй. Дэлгэцэнд харагдаж буй бизнесүүд, тэдгээрийн нэр, хаяг, дугаар, үнэлгээ, сэтгэгдэл бүгд зохиомол бөгөөд бодит бизнесийг төлөөлөхгүй. Захиалга бодит бизнест очихгүй.</p>
        <p>Газрын зураг нь дүрслэлийн зорилготой бөгөөд хил хязгаар, зам, зайг хэмжих үнэн зөв эх сурвалж биш.</p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Бизнес хайх</Link>
        <Link href="/burtgel?role=OWNER&next=/biznes-burtguuleh" className="btn btn-ghost">Бизнесээ бүртгүүлэх</Link>
      </div>
    </div>
  );
}
