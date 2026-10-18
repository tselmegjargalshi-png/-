"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow">Алдаа</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">Уучлаарай, алдаа гарлаа.</h1>
      <p className="mt-3 text-ink-2">Түр хүлээгээд дахин оролдоно уу. Асуудал үргэлжилбэл бидэнд мэдэгдээрэй.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Дахин оролдох</button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="btn btn-ghost">Нүүр хуудас</a>
      </div>
    </main>
  );
}
