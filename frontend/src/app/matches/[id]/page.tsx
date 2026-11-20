import { arenaLayouts } from "@/app/data/arenaLayouts";

import MatchContent from "@/app/components/MatchContent";

import { matches } from "@/app/data/matches";

import { offers } from "@/app/data/offers";

export const instant = false;

type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MatchPage({
  params,
}: MatchPageProps) {
  const { id } = await params;

  const match = matches.find((item) => item.id === Number(id));

  if (!match) {
    return <div>Матч не найден</div>;
  }

  const matchOffers = offers.filter(
    (offer) => offer.matchId === match.id
  );

  const arenaId = match.arenaId;

  const arena = arenaLayouts.find(
    (layout) => layout.id === arenaId
  ) ?? arenaLayouts[0];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 md:px-16">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#F28C28]">
          PARMA RESELL
        </p>

        <h1 className="text-3xl font-black">
          БК ПАРМА — {match.opponent}
        </h1>

        <p className="mt-4 text-gray-500">
          {match.tournament}
        </p>

        <p className="mt-2 text-sm font-bold text-[#0057A8]">
          {match.matchType === "home" ? "Домашний матч" : "Выездной матч"}
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Дата матча</p>
            <p className="mt-1 font-bold">{match.date}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Начало</p>
            <p className="mt-1 font-bold">{match.time}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Место проведения</p>
            <p className="mt-1 font-bold">{match.venue}</p>
          </div>
        </div>

        <div className="mt-10">
          <MatchContent arena={arena} offers={matchOffers} />
        </div>       

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