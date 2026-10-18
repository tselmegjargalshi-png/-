"use client";

import { useEffect, type ReactNode } from "react";
import { useDiscovery } from "../shell/DiscoveryProvider";

/** Сервер талын профайл ачаалагдсаныг shell-д мэдэгдэнэ. Түүнээс өмнө араг яс харагдана. */
export function ProfileBoundary({ slug, children }: { slug: string; children: ReactNode }) {
  const { markProfileLoaded } = useDiscovery();
  useEffect(() => {
    markProfileLoaded(slug);
  }, [slug, markProfileLoaded]);
  return <>{children}</>;
}
