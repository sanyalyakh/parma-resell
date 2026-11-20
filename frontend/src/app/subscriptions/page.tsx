"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiTicket, getToken } from "@/app/lib/api";
import Link from "next/link";
import Header from "@/app/components/Header";

type Subscription = {
  id: string;
  number: string;
  season: string;
  sector: string;
  row: string;
  seat: string;
  status: "Активен" | "На проверке";
};


export default function SubscriptionsPage() {
  const [showExpired, setShowExpired] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!getToken()) { Promise.resolve().then(() => setError("Для просмотра абонементов войдите в аккаунт")); return; }
    apiRequest<{items: ApiTicket[]}>("/api/my/tickets")
      .then(({items}) => setSubscriptions(items.map(t => ({id: t.id, number: t.id.slice(0,8), season: t.season,
        sector: "—", row: "—", seat: "—", status: t.verification_status === "verified" ? "Активен" : "На проверке"}))))
      .catch(e => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, []);

  const filteredSubscriptions = showExpired
    ? subscriptions
    : subscriptions.filter(
        (subscription) => subscription.status === "Активен"
      );

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <div className="px-6 py-12 md:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
            PARMA RESELL
          </p>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black text-gray-900">
                Мои абонементы
              </h1>

              <p className="mt-2 text-gray-500">
                Абонементы, привязанные к твоему аккаунту (автоматическая синхронизация с клубом пока недоступна)
              </p>
            </div>

            <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
              <p className="text-sm text-gray-500">
                Всего абонементов
              </p>
              <p className="mt-1 text-2xl font-black text-[#0057A8]">
                {subscriptions.length}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setShowExpired(false)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                !showExpired
                  ? "bg-[#0057A8] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Активные
            </button>

            <button
              onClick={() => setShowExpired(true)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                showExpired
                  ? "bg-[#0057A8] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Все абонементы
            </button>
          </div>

          {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
          {filteredSubscriptions.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="bg-[#0057A8] p-6 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold tracking-wider">
                        БК ПАРМА
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          subscription.status === "Активен"
                            ? "bg-green-400/20 text-green-100"
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <p className="mt-8 text-sm text-blue-200">
                      ID абонемента
                    </p>

                    <h2 className="mt-1 text-3xl font-black">
                      № {subscription.number}
                    </h2>

                    <p className="mt-3 text-sm text-blue-100">
                      Сезон {subscription.season}
                    </p>
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Место на арене
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-[#F3F6FA] p-3">
                        <p className="text-xs text-gray-500">Сектор</p>
                        <p className="mt-1 font-black text-gray-900">
                          {subscription.sector.replace("Сектор ", "")}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F3F6FA] p-3">
                        <p className="text-xs text-gray-500">Ряд</p>
                        <p className="mt-1 font-black text-gray-900">
                          {subscription.row}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F3F6FA] p-3">
                        <p className="text-xs text-gray-500">Место</p>
                        <p className="mt-1 font-black text-gray-900">
                          {subscription.seat}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0057A8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 9V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6Z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
              </div>

              <h2 className="mt-5 text-xl font-black text-gray-900">
                Абонементов пока нет
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                Здесь появятся абонементы, привязанные к твоему номеру телефона.
              </p>
            </div>
          )}

          <Link
            href="/"
            className="mt-10 inline-block text-sm font-semibold text-[#0057A8] transition hover:text-[#F28C28]"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </main>
  );
}
