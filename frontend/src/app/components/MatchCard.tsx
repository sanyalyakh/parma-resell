type MatchCardProps = {
  id: number;
  date: string;
  opponent: string;
  hasOffers: boolean;
  arenaName: string;
  matchType: "home" | "away";
  venue: string;
};

export default function MatchCard({
  id,
  opponent,
  hasOffers,
  date,
  matchType,
  venue,
}: MatchCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="mb-6 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            hasOffers
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {hasOffers ? "Есть предложения" : "Пока нет предложений"}
        </span>

        <span className="text-xs text-gray-400">
          Демо-данные
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {date}
      </p>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-black">БК ПАРМА</h3>

        <span className="text-lg font-bold text-[#F28C28]">
          VS
        </span>

        <h3 className="text-right text-xl font-black">
          {opponent}
        </h3>
      </div>

      <div className="my-6 border-t border-gray-100"></div>

      <p className="mb-5 text-sm text-gray-500">
        {matchType === "home" ? "Домашний матч" : "Выездной матч"} · {venue}
      </p>

      <a
        href={`/matches/${id}`}
        aria-disabled={!hasOffers}
        className={`block w-full rounded-lg px-5 py-3 text-center font-bold transition ${
          hasOffers
            ? "bg-[#0057A8] text-white hover:bg-[#004580]"
            : "pointer-events-none cursor-not-allowed bg-gray-200 text-gray-500"
         }`}
      >
        {hasOffers
          ? "Смотреть предложения →"
          : "Предложений пока нет"}
      </a>

    </article>
  );
}
