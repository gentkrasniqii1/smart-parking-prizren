export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Zona #{id}</h1>
      <p className="text-muted-foreground">Faza 2: detajet e zonës do të shtohen këtu.</p>
    </main>
  );
}
