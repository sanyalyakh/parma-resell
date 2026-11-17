
"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const tickets = [
  {
    id: 1,
    opponent: "Соперник 01",
    date: "15 декабря 2026",
    time: "19:00",
    arena: "УДС «Молот»",
    sector: "Сектор A",
    row: 3,
    seat: 12,
    price: 1500,
  },
  {
    id: 2,
    opponent: "Соперник 02",
    date: "5 января 2027",
    time: "19:00",
    arena: "Тестовая арена",
    sector: "Сектор B",
    row: 5,
    seat: 8,
    price: 1000,
  },
  {
    id: 3,
    opponent: "Соперник 03",
    date: "15 января 2027",
    time: "19:00",
    arena: "УДС «Молот»",
    sector: "Сектор C",
    row: 2,
    seat: 15,
    price: 1700,
  },
];

function TicketContent() {
  const params = useParams();
  const router = useRouter();

  const ticket = tickets.find(
    (item) => item.id === Number(params.id)
  );

  if (!ticket) {
    return (
      <main className="min-h-screen bg-[#F3F6FA] p-10">
        <h1 className="text-2xl font-black text-gray-900">
          Билет не найден
        </h1>

        <button
          onClick={() => router.push("/purchases")}
          className="mt-5 rounded-xl bg-[#0057A8] px-5 py-3 font-bold text-white"
        >
          Вернуться к покупкам
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F6FA] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/purchases")}
          className="mb-8 text-sm font-bold text-[#0057A8] hover:underline"
        >
          ← Назад к покупкам
        </button>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-[#0057A8] px-8 py-8 text-white">
            <p className="text-sm font-bold tracking-widest text-blue-200">
              PARMA RESELL
            </p>

            <h1 className="mt-5 text-3xl font-black">
              Электронный билет
            </h1>

            <p className="mt-2 text-blue-100">
              БК ПАРМА — {ticket.opponent}
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Дата</p>
                <p className="mt-1 font-bold text-gray-900">
                  {ticket.date}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Время</p>
                <p className="mt-1 font-bold text-gray-900">
                  {ticket.time}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-gray-400">Арена</p>
                <p className="mt-1 font-bold text-gray-900">
                  {ticket.arena}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-gray-300" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400">Сектор</p>
                <p className="mt-2 text-xl font-black text-[#0057A8]">
                  {ticket.sector.replace("Сектор ", "")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Ряд</p>
                <p className="mt-2 text-xl font-black text-[#0057A8]">
                  {ticket.row}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Место</p>
                <p className="mt-2 text-xl font-black text-[#0057A8]">
                  {ticket.seat}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-gray-300" />

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Оплачено</span>
              <span className="text-2xl font-black text-[#F28C28]">
                {ticket.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <div className="mt-8 flex flex-col items-center rounded-2xl bg-[#F3F6FA] p-6">
              <div className="flex h-40 w-40 items-center justify-center rounded-xl border-4 border-[#0057A8] bg-white p-3">
                <div className="text-center">
                  <div className="text-6xl">▦</div>
                  <p className="mt-2 text-xs font-bold text-gray-500">
                    DEMO QR
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700">
                Демонстрационный билет
              </p>

              <p className="mt-1 text-center text-xs text-gray-400">
                QR-код пока тестовый и не предназначен для прохода на матч
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F3F6FA] p-10">
          Загружаем билет...
        </main>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
