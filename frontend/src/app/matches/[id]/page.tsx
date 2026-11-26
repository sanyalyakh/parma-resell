import { notFound } from "next/navigation";

import { arenaLayouts } from "@/app/data/arenaLayouts";
import MatchContent from "@/app/components/MatchContent";
import type { Match } from "@/app/data/matches";

type ListingsResponse = {
  items: {
    id: string;
    sector: string;
    row: string | number;
    number: string | number;
    price_kopecks: string | number;
  }[];
};

type SeatsResponse = {
  items: {
    id: string;
    sector: string;
    row: string | number;
    number: string | number;
    status: "available" | "active" | "reserved" | "sold";
  }[];
};

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

  let response: Response;

  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`,
      { cache: "no-store" }
    );
  } catch {
    throw new Error("Не удалось загрузить информацию о матче");
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Не удалось загрузить матч");
  }

  const match: Match = await response.json();

  const [listingsResponse, seatsResponse] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}/listings`,
      { cache: "no-store" }
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}/seats`,
      { cache: "no-store" }
    ),
  ]);

  if (!listingsResponse.ok || !seatsResponse.ok) {
    throw new Error("Не удалось загрузить места и предложения");
  }

  const listingsData: ListingsResponse =
    await listingsResponse.json();

  const seatsData: SeatsResponse =
    await seatsResponse.json();

  const matchOffers = listingsData.items.map((item) => ({
    id: item.id,
    sector: item.sector,
    row: Number(item.row),
    seat: Number(item.number),
    price: Number(item.price_kopecks) / 100,
  }));

  const matchSeats = seatsData.items.map((item) => ({
    id: item.id,
    sector: item.sector,
    row: Number(item.row),
    number: Number(item.number),
    status: item.status,
  }));

  const arena = arenaLayouts[0];

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(match.starts_at));

  const formattedTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(match.starts_at));

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 md:px-16">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#F28C28]">
          PARMA RESELL
        </p>

        <h1 className="text-3xl font-black">
          ПАРМА — {match.opponent}
        </h1>

        <p className="mt-4 text-gray-500">
          Домашний матч БК «ПАРМА»
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Дата матча</p>
            <p className="mt-1 font-bold">{formattedDate}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Начало</p>
            <p className="mt-1 font-bold">{formattedTime}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">Место проведения</p>
            <p className="mt-1 font-bold">
              Домашняя арена БК «ПАРМА»
            </p>
          </div>
        </div>

        <div className="mt-10">
          <MatchContent
            arena={arena}
            offers={matchOffers}
            seats={matchSeats}
          />
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
