import { ZoneDetailClient } from "./zone-detail-client";

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-4 md:p-8">
      <ZoneDetailClient zoneId={id} />
    </main>
  );
}
