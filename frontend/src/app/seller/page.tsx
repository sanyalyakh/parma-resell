"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";

type SellerOffer = {
  id: string;
  match_id: string;
  season_ticket_id: string;
  price_kopecks: number;
  status: string;
  season: string | null;
  opponent: string | null;
  starts_at: string | null;
  sector: string | null;
  row: number | null;
  number: number | null;
};

type SellerTicket = {
  id: string;
  club_id: string;
  seat_id: string;
  season: string;
  verification_status: string;
  sector: string;
  row: string | number;
  number: string | number;
  venue_id: string;
  venue_name: string;
};

type EligibleMatch = {
  id: string;
  club_id: string;
  opponent: string;
  starts_at: string;
  status: string;
  venue_id: string;
  venue_name: string;
  match_type: string;
};

type ApiResponse<T> = {
  items: T[];
  message?: string;
};

function getOfferStatus(status: string) {
  const labels: Record<string, string> = {
    published: "Опубликовано",
    draft: "Черновик",
    withdrawn: "Снято с публикации",
    sold: "Продано",
  };

  return labels[status] || status;
}

function getVerificationStatus(status: string) {
  const labels: Record<string, string> = {
    verified: "Проверен",
    pending: "На проверке",
    rejected: "Отклонён",
  };

  return labels[status] || status;
}

function formatDate(value: string | null) {
  if (!value) return "Дата не указана";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SellerPage() {
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [tickets, setTickets] = useState<SellerTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState("Все");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Состояние создания предложения
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [eligibleMatches, setEligibleMatches] = useState<EligibleMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const [price, setPrice] = useState("");

  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Управление снятием предложения
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSellerData() {
      try {
        const [listingsResponse, ticketsResponse] = await Promise.all([
          fetch("/api/my/listings", { cache: "no-store" }),
          fetch("/api/my/tickets", { cache: "no-store" }),
        ]);

        const [listingsData, ticketsData] = await Promise.all([
          listingsResponse.json(),
          ticketsResponse.json(),
        ]);

        if (!listingsResponse.ok) {
          throw new Error(
            listingsData.message || "Не удалось загрузить предложения"
          );
        }

        if (!ticketsResponse.ok) {
          throw new Error(
            ticketsData.message || "Не удалось загрузить абонементы"
          );
        }

        if (isMounted) {
          setOffers(listingsData.items || []);
          setTickets(ticketsData.items || []);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить данные продавца"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSellerData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOffers =
    statusFilter === "Все"
      ? offers
      : offers.filter((offer) => offer.status === statusFilter);

  const publishedCount = offers.filter(
    (offer) => offer.status === "published"
  ).length;

  const draftCount = offers.filter(
    (offer) => offer.status === "draft"
  ).length;

  const soldCount = offers.filter(
    (offer) => offer.status === "sold"
  ).length;

  const totalSales =
    offers
      .filter((offer) => offer.status === "sold")
      .reduce((sum, offer) => sum + offer.price_kopecks, 0) / 100;

  // Выбранный абонемент
  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId
  );

  // Загрузка подходящих матчей для выбранного абонемента
  const handleTicketChange = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSelectedMatchId("");
    setEligibleMatches([]);
    setFormError("");
    setFormSuccess("");

    if (!ticketId) {
      return;
    }

    const ticket = tickets.find((item) => item.id === ticketId);

    if (!ticket || ticket.verification_status !== "verified") {
      setFormError("Для создания предложения нужен проверенный абонемент.");
      return;
    }

    setIsLoadingMatches(true);

    try {
      const response = await fetch(
        `/api/my/tickets/${encodeURIComponent(ticketId)}/eligible-matches`,
        { cache: "no-store" }
      );

      const data: ApiResponse<EligibleMatch> = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Не удалось загрузить подходящие матчи"
        );
      }

      setEligibleMatches(data.items || []);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить подходящие матчи"
      );
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Создание предложения
  const handleCreateOffer = async () => {
    setFormError("");
    setFormSuccess("");

    if (!selectedTicketId || !selectedMatchId || !price) {
      setFormError("Выберите абонемент, матч и укажите цену.");
      return;
    }

    const priceInRubles = Number(price);

    if (
      !Number.isSafeInteger(priceInRubles) ||
      priceInRubles <= 0 ||
      priceInRubles > 1_000_000
    ) {
      setFormError("Цена должна быть целым числом от 1 до 1 000 000 ₽.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/my/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          season_ticket_id: selectedTicketId,
          match_id: selectedMatchId,
          price_kopecks: priceInRubles * 100,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Не удалось создать предложение"
        );
      }

      // Обновляем список предложений из backend
      const listingsResponse = await fetch("/api/my/listings", {
        cache: "no-store",
      });

      if (listingsResponse.ok) {
        const listingsData: ApiResponse<SellerOffer> =
          await listingsResponse.json();

        setOffers(listingsData.items || []);
      }

      setSelectedTicketId("");
      setSelectedMatchId("");
      setEligibleMatches([]);
      setPrice("");
      setShowCreateForm(false);

      setStatusFilter("Все");
      setFormSuccess(
        "Предложение успешно создано и сохранено как черновик."
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка при создании предложения"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Снятие черновика с публикации
  const handleWithdraw = async (listingId: string) => {
    setWithdrawError("");
    setWithdrawSuccess("");
    setIsWithdrawing(true);

    try {
      const response = await fetch(
        `/api/my/listings/${encodeURIComponent(listingId)}/withdraw`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Не удалось снять предложение"
        );
      }

      // Сразу обновляем статус в интерфейсе
      setOffers((previousOffers) =>
        previousOffers.map((offer) =>
          offer.id === listingId
            ? { ...offer, status: "withdrawn" }
            : offer
        )
      );

      setConfirmWithdrawId(null);
      setWithdrawSuccess("Черновик успешно снят с публикации.");

      // Синхронизируем список с backend
      try {
        const listingsResponse = await fetch("/api/my/listings", {
          cache: "no-store",
        });

        if (listingsResponse.ok) {
          const listingsData: ApiResponse<SellerOffer> =
            await listingsResponse.json();

          setOffers(listingsData.items || []);
        }
      } catch {
        // Уже подтверждённый результат сохраняем в интерфейсе.
      }
    } catch (error) {
      setWithdrawError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка при снятии предложения"
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F6FA]">
      <Header />

      <div className="px-6 py-12 md:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
            PARMA RESELL
          </p>

          <h1 className="mt-4 text-3xl font-black text-gray-900">
            Кабинет продавца
          </h1>

          <p className="mt-2 text-gray-500">
            Управляйте своими абонементами и предложениями
          </p>

          {isLoading && (
            <p className="mt-10 text-center text-gray-500">
              Загружаем данные продавца...
            </p>
          )}

          {error && (
            <div className="mt-8 rounded-2xl bg-white p-6 text-center">
              <p className="font-bold text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Статистика */}
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Опубликовано</p>
                  <p className="mt-3 text-3xl font-black text-[#0057A8]">
                    {publishedCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Черновики</p>
                  <p className="mt-3 text-3xl font-black text-[#F28C28]">
                    {draftCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Проданные</p>
                  <p className="mt-3 text-3xl font-black text-[#0057A8]">
                    {soldCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Сумма продаж</p>
                  <p className="mt-3 text-3xl font-black text-[#F28C28]">
                    {totalSales.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>

              {/* Мои абонементы */}
              <section className="mt-12">
                <h2 className="text-2xl font-black text-gray-900">
                  Мои абонементы
                </h2>

                {tickets.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-white p-8 text-center">
                    <p className="font-semibold text-gray-700">
                      Абонементов пока нет
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-2xl bg-white p-6 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#0057A8]">
                            Абонемент
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              ticket.verification_status === "verified"
                                ? "bg-green-100 text-green-700"
                                : ticket.verification_status === "pending"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getVerificationStatus(
                              ticket.verification_status
                            )}
                          </span>
                        </div>

                        <p className="mt-5 text-2xl font-black text-gray-900">
                          Сезон {ticket.season}
                        </p>

                        <p className="mt-2 break-all text-xs text-gray-400">
                          ID: {ticket.id}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Мои предложения */}
              <section className="mt-12">
                <h2 className="text-2xl font-black text-gray-900">
                  Мои предложения
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { label: "Все", value: "Все" },
                    { label: "Опубликованные", value: "published" },
                    { label: "Черновики", value: "draft" },
                    { label: "Проданные", value: "sold" },
                    {
                      label: "Снятые с публикации",
                      value: "withdrawn",
                    },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        statusFilter === filter.value
                          ? "bg-[#0057A8] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {withdrawSuccess && (
                  <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                    {withdrawSuccess}
                  </div>
                )}

                {withdrawError && (
                  <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {withdrawError}
                  </div>
                )}

                {filteredOffers.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-gray-700">
                      Предложений пока нет
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Здесь будут отображаться ваши предложения.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="rounded-2xl bg-white p-6 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#0057A8]">
                            {offer.opponent || "Матч не указан"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              offer.status === "published"
                                ? "bg-green-100 text-green-700"
                                : offer.status === "draft"
                                  ? "bg-orange-100 text-orange-700"
                                  : offer.status === "sold"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getOfferStatus(offer.status)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                          {formatDate(offer.starts_at)}
                          {offer.starts_at &&
                            ` · ${formatTime(offer.starts_at)}`}
                        </p>

                        <div className="mt-5 rounded-xl bg-[#F3F6FA] p-4">
                          <p className="font-bold text-gray-900">
                            {offer.sector
                              ? `Сектор ${offer.sector}`
                              : "Сектор не указан"}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Ряд {offer.row ?? "—"} · Место{" "}
                            {offer.number ?? "—"}
                          </p>

                          <p className="mt-3 text-xs text-gray-400">
                            Сезон {offer.season || "—"}
                          </p>
                        </div>

                        <div className="mt-5">
                          <p className="text-2xl font-black text-[#F28C28]">
                            {(offer.price_kopecks / 100).toLocaleString(
                              "ru-RU"
                            )}{" "}
                            ₽
                          </p>
                        </div>

                        {/* Снятие черновика */}
                        {offer.status === "draft" && (
                          <div className="mt-5">
                            {confirmWithdrawId === offer.id ? (
                              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                                <p className="font-bold text-gray-900">
                                  Снять этот черновик?
                                </p>

                                <p className="mt-2 text-sm text-gray-600">
                                  Предложение будет снято и перестанет отображаться
                                  среди доступных для дальнейшей публикации.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleWithdraw(offer.id)}
                                    disabled={isWithdrawing}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {isWithdrawing ? "Снимаем..." : "Да, снять"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmWithdrawId(null);
                                      setWithdrawError("");
                                    }}
                                    disabled={isWithdrawing}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmWithdrawId(offer.id);
                                  setWithdrawError("");
                                  setWithdrawSuccess("");
                                }}
                                className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                              >
                                Снять черновик
                              </button>
                            )}
                          </div>
                        )}

                        {tickets.some(
                          (ticket) =>
                            ticket.id === offer.season_ticket_id &&
                            ticket.verification_status !== "verified"
                        ) && (
                          <p className="mt-4 text-xs text-orange-700">
                            Абонемент ещё не прошёл проверку.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {/* Создание предложения */}
              <section className="mt-12">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      Создание предложения
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Выберите абонемент, матч и укажите стоимость.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(!showCreateForm);
                      setFormError("");
                      setFormSuccess("");
                    }}
                    className="rounded-xl bg-[#0057A8] px-6 py-3 font-bold text-white transition hover:bg-[#004580]"
                  >
                    {showCreateForm ? "Скрыть форму" : "+ Создать предложение"}
                  </button>
                </div>

                {formSuccess && (
                  <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                    {formSuccess}
                  </div>
                )}

                {showCreateForm && (
                  <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
                    <div className="space-y-7">

                      {/* Выбор абонемента */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700">
                          1. Выберите абонемент
                        </label>

                        <select
                          value={selectedTicketId}
                          onChange={(e) => handleTicketChange(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#0057A8]"
                        >
                          <option value="">Выберите абонемент</option>

                          {tickets
                            .filter(
                              (ticket) => ticket.verification_status === "verified"
                            )
                            .map((ticket) => (
                              <option key={ticket.id} value={ticket.id}>
                                Сезон {ticket.season} · Сектор {ticket.sector} · Ряд {ticket.row} · Место {ticket.number}
                              </option>
                            ))}
                        </select>

                        {tickets.length === 0 && (
                          <p className="mt-2 text-sm text-gray-500">
                            У вас пока нет абонементов.
                          </p>
                        )}

                        {tickets.length > 0 &&
                          !tickets.some(
                            (ticket) => ticket.verification_status === "verified"
                          ) && (
                            <p className="mt-2 text-sm text-orange-600">
                              Для создания предложения нужен подтверждённый абонемент.
                            </p>
                          )}
                      </div>

                      {/* Автоматическое отображение места */}
                      {selectedTicket && (
                        <div className="rounded-xl border border-blue-100 bg-[#F3F6FA] p-5">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Место по выбранному абонементу
                          </p>

                          <p className="mt-3 text-lg font-black text-[#0057A8]">
                            Сектор {selectedTicket.sector} · Ряд {selectedTicket.row} · Место {selectedTicket.number}
                          </p>

                          <p className="mt-2 text-sm text-gray-600">
                            {selectedTicket.venue_name} · Сезон {selectedTicket.season}
                          </p>

                          <p className="mt-3 text-xs text-green-700">
                            Абонемент подтверждён. Место заполнено автоматически.
                          </p>
                        </div>
                      )}

                      {/* Выбор матча */}
                      {selectedTicket && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700">
                            2. Выберите матч
                          </label>

                          {isLoadingMatches ? (
                            <p className="mt-3 text-sm text-gray-500">
                              Загружаем подходящие матчи...
                            </p>
                          ) : eligibleMatches.length > 0 ? (
                            <>
                              <select
                                value={selectedMatchId}
                                onChange={(e) => {
                                  setSelectedMatchId(e.target.value);
                                  setFormError("");
                                  setFormSuccess("");
                                }}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#0057A8]"
                              >
                                <option value="">Выберите матч</option>

                                {eligibleMatches.map((match) => (
                                  <option key={match.id} value={match.id}>
                                    ПАРМА — {match.opponent} · {formatDate(match.starts_at)} · {formatTime(match.starts_at)} · {match.venue_name}
                                  </option>
                                ))}
                              </select>

                              {selectedMatchId && (
                                <p className="mt-3 text-sm text-green-700">
                                  Матч выбран. Он соответствует вашему абонементу.
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="mt-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
                              Для этого абонемента сейчас нет доступных матчей. Попробуйте выбрать другой абонемент.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Цена */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700">
                          3. Цена предложения (₽)
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="1000000"
                          step="1"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          disabled={!selectedMatchId}
                          placeholder="Например, 1500"
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-[#0057A8] disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                        <p className="mt-2 text-xs text-gray-400">
                          Укажите стоимость в целых рублях.
                        </p>
                      </div>

                      {/* Ошибка */}
                      {formError && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                          {formError}
                        </div>
                      )}

                      {/* Кнопки */}
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleCreateOffer}
                          disabled={
                            !selectedTicketId ||
                            !selectedMatchId ||
                            !price ||
                            isSubmitting ||
                            isLoadingMatches
                          }
                          className="rounded-xl bg-[#F28C28] px-7 py-3 font-bold text-white transition hover:bg-[#e47b19] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? "Создаём предложение..." : "Создать предложение"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setSelectedTicketId("");
                            setSelectedMatchId("");
                            setEligibleMatches([]);
                            setPrice("");
                            setFormError("");
                            setFormSuccess("");
                          }}
                          className="rounded-xl border border-gray-200 px-7 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
