import { Header } from "@/components/Header";
import { DiscoveryProvider } from "@/components/shell/DiscoveryProvider";
import { Shell } from "@/components/shell/Shell";
import { getViewer } from "@/server/auth";
import { getActiveSummaries, getCategories, getLocationList, getSavedIds } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const [businesses, categories, locations, saved] = await Promise.all([
    getActiveSummaries(),
    getCategories(),
    getLocationList(),
    getSavedIds(viewer?.id),
  ]);
  return (
    <DiscoveryProvider
      businesses={businesses}
      categories={categories}
      locations={locations}
      viewer={viewer}
      initialSaved={saved}
      nowIso={new Date().toISOString()}
    >
      <Shell header={<Header variant="bar" />}>{children}</Shell>
    </DiscoveryProvider>
  );
}
