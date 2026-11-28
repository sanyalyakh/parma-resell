"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";

type Purchase = {
  id: string;
  status: string;
  amount_kopecks: number;
  listing_id: string;
  match_id: string;
  opponent: string;
  starts_at: string;
};

type OrdersResponse = {
  items: Purchase[];
  message?: string;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Завершён";
    case "pending":
      return "Ожидает";
    case "cancelled":
      return "Отменён";
    default:
      return status;
  }
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [statusFilter, setStatusFilter] = useState("Все");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPurchases() {
      try {
        const response = await fetch("/api/my/orders", {
          cache: "no-store",
        });

        const data: OrdersResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Не удалось загрузить покупки"
          );
        }

        if (isMounted) {
          setPurchases(data.items || []);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Произошла ошибка при загрузке"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPurchases();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusOptions = [
    "Все",
    ...Array.from(new Set(purchases.map((purchase) => purchase.status))),
  ];

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

          {isLoading && (
            <p className="mt-10 text-center text-gray-500">
              Загружаем историю покупок...
            </p>
          )}

          {error && (
            <div className="mt-8 rounded-xl bg-white p-6 text-center">
              <p className="font-bold text-red-600">
                {error}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Проверьте авторизацию и попробуйте обновить страницу.
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                      statusFilter === status
                        ? "bg-[#0057A8] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {status === "Все"
                      ? "Все"
                      : getStatusLabel(status)}
                  </button>
                ))}
              </div>

              {purchases.length === 0 ? (
                <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">
                    Пока нет покупок
                  </h2>
                  <p className="mt-2 text-gray-500">
                    Здесь появятся ваши приобретённые билеты.
                  </p>
                </div>
              ) : filteredPurchases.length === 0 ? (
                <p className="mt-10 rounded-xl bg-white p-8 text-center text-gray-500">
                  Покупок с таким статусом пока нет.
                </p>
              ) : (
                <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPurchases.map((purchase) => {
                    const matchDate = new Date(purchase.starts_at);
                    const validDate = !Number.isNaN(
                      matchDate.getTime()
                    );

                    const formattedDate = validDate
                      ? new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(matchDate)
                      : "Дата не указана";

                    const formattedTime = validDate
                      ? new Intl.DateTimeFormat("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(matchDate)
                      : "";

                    const statusClass =
                      purchase.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : purchase.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : purchase.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600";

                    const isDemo = purchase.opponent
                      .toLowerCase()
                      .includes("демо");

                    return (
                      <div
                        key={purchase.id}
                        className="rounded-2xl bg-white p-6 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-[#0057A8]">
                            PARMA RESELL
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                          >
                            {getStatusLabel(purchase.status)}
                          </span>
                        </div>

                        <h2 className="mt-5 text-xl font-black text-gray-900">
                          БК ПАРМА — {purchase.opponent}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                          {formattedDate} · {formattedTime}
                        </p>

                        <div className="mt-5 rounded-xl bg-[#F3F6FA] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Номер заказа
                          </p>

                          <p className="mt-1 break-all text-sm font-medium text-gray-700">
                            {purchase.id}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Стоимость заказа
                          </span>

                          <span className="text-xl font-black text-[#F28C28]">
                            {(purchase.amount_kopecks / 100).toLocaleString(
                              "ru-RU"
                            )}{" "}
                            ₽
                          </span>
                        </div>

                        {isDemo && (
                          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-xs leading-relaxed text-orange-800">
                            Демонстрационная запись. Реальная оплата
                            и передача права посещения не выполнялись.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}