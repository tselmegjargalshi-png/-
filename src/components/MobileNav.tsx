"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Compass, Home, Map as MapIcon, Search, User } from "lucide-react";
import type { ReactNode } from "react";
import { useDiscoveryOptional, type MobileTab } from "./shell/DiscoveryProvider";
import type { Viewer } from "@/lib/types";

const base = "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors";

function Item({ active, children, label, ...rest }: { active: boolean; children: ReactNode; label: string } & ({ href: string } | { onClick: () => void })) {
  const cls = `${base} ${active ? "text-ink" : "text-ink-3 hover:text-ink"}`;
  const inner = (
    <>
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" aria-hidden="true" />}
      {children}
      <span>{label}</span>
    </>
  );
  if ("href" in rest) {
    return (
      <Link href={rest.href} className={cls} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={rest.onClick} className={cls} aria-current={active ? "page" : undefined}>
      {inner}
    </button>
  );
}

export function MobileNav({ viewer }: { viewer: Viewer }) {
  const d = useDiscoveryOptional();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = !!d && !d.profileSlug && pathname === "/";

  const go = (tab: MobileTab) => {
    if (!d) return;
    d.setMobileTab(tab);
    if (d.profileSlug) d.closeProfile();
  };

  const isAccount = pathname.startsWith("/hereglegch");
  const savedTab = isAccount && typeof window !== "undefined" && window.location.search.includes("hadgalsan");

  return (
    <nav aria-label="Гар утасны цэс" className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-bg/95 backdrop-blur lg:hidden">
      {d ? (
        <>
          <Item label="Нүүр" active={onHome && d.mobileTab === "home"} onClick={() => go("home")}>
            <Home size={20} />
          </Item>
          <Item label="Хайх" active={onHome && d.mobileTab === "search"} onClick={() => go("search")}>
            <Search size={20} />
          </Item>
          <Item label="Газрын зураг" active={onHome && d.mobileTab === "map"} onClick={() => go("map")}>
            <MapIcon size={20} />
          </Item>
          <Item
            label="Хадгалсан"
            active={savedTab}
            onClick={() => (viewer ? router.push("/hereglegch?tab=hadgalsan") : d.setAuthPrompt(true))}
          >
            <Bookmark size={20} />
          </Item>
          <Item label="Профайл" active={isAccount && !savedTab} href={viewer ? "/hereglegch" : "/nevtreh"}>
            <User size={20} />
          </Item>
        </>
      ) : (
        <>
          <Item label="Нүүр" active={false} href="/">
            <Home size={20} />
          </Item>
          <Item label="Хайх" active={false} href="/?t=search">
            <Search size={20} />
          </Item>
          <Item label="Газрын зураг" active={false} href="/?t=map">
            <Compass size={20} />
          </Item>
          <Item label="Хадгалсан" active={savedTab} href={viewer ? "/hereglegch?tab=hadgalsan" : "/nevtreh?next=/hereglegch%3Ftab%3Dhadgalsan"}>
            <Bookmark size={20} />
          </Item>
          <Item label="Профайл" active={isAccount && !savedTab} href={viewer ? "/hereglegch" : "/nevtreh"}>
            <User size={20} />
          </Item>
        </>
      )}
    </nav>
  );
}
