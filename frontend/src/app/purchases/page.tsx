"use client";

import { useState } from "react";

import Link from "next/link";

import Header from "@/app/components/Header";

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState("Все");

  const filteredPurchases =
    statusFilter === "Все"
      ? purchases
      : purchases.filter(
          (purchase) => purchase.status === statusFilter
        );

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <div className="px-6 py-12 md:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
            PARMA RESELL
          </p>

          <h1 className="mt-4 text-3xl font-black text-gray-900">
            Мои покупки
          </h1>

          <p className="mt-2 text-gray-500">
            Здесь собраны ваши билеты и история заказов
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["Все", "Оплачен", "Ожидает оплаты", "Отменён"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  statusFilter === status
                    ? "bg-[#0057A8] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status === "Оплачен"
                  ? "Оплаченные"
                  : status === "Ожидает оплаты"
                    ? "Ожидают оплаты"
                    : status === "Отменён"
                      ? "Отменённые"
                      : "Все"}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#0057A8]">
                    PARMA RESELL
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      purchase.status === "Оплачен"
                        ? "bg-green-100 text-green-700"
                        : purchase.status === "Ожидает оплаты"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {purchase.status}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-black text-gray-900">
                  БК ПАРМА — {purchase.opponent}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {purchase.date} · {purchase.time}
                </p>

                <div className="mt-5 rounded-xl bg-[#F3F6FA] p-4">
                  <p className="font-bold text-gray-900">
                    {purchase.arena}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    {purchase.sector}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Ряд {purchase.row} · Место {purchase.seat}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Стоимость билета
                  </span>

                  <span className="text-xl font-black text-[#F28C28]">
                    {purchase.price.toLocaleString("ru-RU")} ₽
                  </span>
                </div>

                {purchase.status === "Оплачен" && (
                  <Link
                    href={`/purchases/${purchase.id}`}
                    className="mt-5 block w-full rounded-xl bg-[#0057A8] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#004680]"
                  >
                    Посмотреть билет
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

const purchases = [
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
    status: "Оплачен",
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
    status: "Ожидает оплаты",
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
    status: "Отменён",
  },
];