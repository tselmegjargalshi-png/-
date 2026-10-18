import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "NOMAD BUSINESS | Монголын бизнесүүдийн газрын зураг", template: "%s | NOMAD BUSINESS" },
  description:
    "Монгол даяарх кафе, ресторан, гоо сайхан, спорт, гар урлал, үйлчилгээ, фрилансеруудыг газрын зураг дээрээс хайж, цаг захиалаарай.",
  applicationName: "NOMAD BUSINESS",
  openGraph: {
    type: "website",
    siteName: "NOMAD BUSINESS",
    locale: "mn_MN",
    title: "NOMAD BUSINESS | Монголын бизнесүүдийн газрын зураг",
    description: "Монгол даяарх бизнесүүдийг газрын зураг дээрээс олж, цагаа захиалаарай.",
  },
  twitter: { card: "summary_large_image", title: "NOMAD BUSINESS", description: "Монголын бизнесүүдийг газрын зураг дээрээс олоорой." },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#efebe2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed left-3 top-3 z-[200] -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition-transform focus:translate-y-0"
        >
          Үндсэн агуулга руу очих
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
