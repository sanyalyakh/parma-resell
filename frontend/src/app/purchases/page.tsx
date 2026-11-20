"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiOrder, getToken } from "@/app/lib/api";


import Header from "@/app/components/Header";

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState("Все");
  const [purchases, setPurchases] = useState<ApiOrder[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!getToken()) { setError("Для просмотра покупок войдите в аккаунт"); return; }
    apiRequest<{items: ApiOrder[]}>("/api/my/orders").then(data => setPurchases(data.items))
      .catch(e => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, []);

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
            {["Все", "completed", "pending", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  statusFilter === status
                    ? "bg-[#0057A8] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status === "completed"
                  ? "Оплаченные"
                  : status === "pending"
                    ? "Ожидают оплаты"
                    : status === "cancelled"
                      ? "Отменённые"
                      : "Все"}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
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
                      purchase.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : purchase.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {purchase.status === "completed" ? "Завершён (демо)" : purchase.status}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-black text-gray-900">
                  БК ПАРМА — {purchase.opponent}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {new Date(purchase.starts_at).toLocaleString("ru-RU")}
                </p>

                <div className="mt-5 rounded-xl bg-[#F3F6FA] p-4">
                  <p className="font-bold text-gray-900">
                    Информация о месте уточняется
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Номер заказа: {purchase.id.slice(0, 8)}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {purchase.status === "completed" ? "Демонстрационная запись, не билет" : "Билет пока не выпущен"}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Стоимость билета
                  </span>

                  <span className="text-xl font-black text-[#F28C28]">
                    {(purchase.amount_kopecks / 100).toLocaleString("ru-RU")} ₽
                  </span>
                </div>

                {purchase.status === "completed" && (
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

