import type { Match } from "@/app/data/matches";

type MatchCardProps = {
  match: Match;
};

export default function MatchCard({ match }: MatchCardProps) {
  const date = new Date(match.starts_at);

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const statusLabels = {
    scheduled: "Предстоящий матч",
    live: "Матч идёт",
    finished: "Завершён",
    cancelled: "Отменён",
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-6 flex items-center justify-between gap-2">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
          {statusLabels[match.status]}
        </span>

        <span className="text-xs text-gray-400">
          {match.competition}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {formattedDate}
      </p>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-black">
          {match.home_club.name}
        </h3>

        <span className="text-lg font-bold text-[#F28C28]">
          VS
        </span>

        <h3 className="text-right text-xl font-black">
          {match.away_club.name}
        </h3>
      </div>

      <div className="my-6 border-t border-gray-100" />

      <p className="mb-5 text-sm text-gray-500">
        {match.arena.name}, {match.arena.city}
      </p>

      <a
        href={`/matches/${match.id}`}
        className="block w-full rounded-lg bg-[#0057A8] px-5 py-3 text-center font-bold text-white transition hover:bg-[#004580]"
      >
        Подробнее о матче →
      </a>
    </article>
  );
}
