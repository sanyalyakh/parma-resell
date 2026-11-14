type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MatchPage({
  params,
}: MatchPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 md:px-16">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#F28C28]">
          PARMA RESELL
        </p>

        <h1 className="text-3xl font-black">
          Страница матча
        </h1>

        <p className="mt-4 text-gray-500">
          Вы выбрали матч с номером: {id}
        </p>

        <a
          href="/"
          className="mt-8 inline-block rounded-lg bg-[#0057A8] px-6 py-3 font-bold text-white transition hover:bg-[#004580]"
        >
          Вернуться к матчам
        </a>
      </div>
    </main>
  );
}