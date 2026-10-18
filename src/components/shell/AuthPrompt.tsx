"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "../ui/Modal";
import { useDiscovery } from "./DiscoveryProvider";

export function AuthPrompt() {
  const d = useDiscovery();
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  return (
    <Modal open={d.authPrompt} onClose={() => d.setAuthPrompt(false)} title="Нэвтэрч орно уу" size="sm">
      <p className="text-[15px] leading-relaxed text-ink-2">Бизнесийг хадгалах, захиалга хийх, сэтгэгдэл бичихийн тулд бүртгэлээрээ нэвтэрнэ үү.</p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Link href={`/nevtreh?next=${next}`} className="btn btn-primary">
          Нэвтрэх
        </Link>
        <Link href={`/burtgel?next=${next}`} className="btn btn-ghost">
          Шинээр бүртгүүлэх
        </Link>
      </div>
    </Modal>
  );
}
