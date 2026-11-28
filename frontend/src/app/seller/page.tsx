
"use client";

import { useState } from "react";
import Header from "@/app/components/Header";

type SellerOffer = {
  id: number;
  opponent: string;
  date: string;
  sector: string;
  row: number;
  seat: number;
  price: number;
  status: "Активно" | "Продано" | "Снято с продажи";
};

const sellerOffers: SellerOffer[] = [
  {
    id: 1,
    opponent: "Соперник 01",
    date: "15 декабря",
    sector: "Сектор A",
    row: 3,
    seat: 12,
    price: 1500,
    status: "Активно",
  },
  {
    id: 2,
    opponent: "Соперник 01",
    date: "15 декабря",
    sector: "Сектор B",
    row: 5,
    seat: 8,
    price: 1000,
    status: "Активно",
  },
  {
    id: 3,
    opponent: "Соперник 03",
    date: "15 января",
    sector: "Сектор C",
    row: 2,
    seat: 15,
    price: 1700,
    status: "Продано",
  },
];

function formatOfferDate(date: string) {
  if (!date.includes("-")) {
    return date;
  }

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export default function SellerPage() {
  const [offers, setOffers] = useState<SellerOffer[]>(sellerOffers);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [editedPrice, setEditedPrice] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [newOffer, setNewOffer] = useState({
    opponent: "",
    date: "",
    sector: "Сектор A",
    row: "",
    seat: "",
    price: "",
  });

  const [statusFilter, setStatusFilter] = useState("Все");

  const filteredOffers = offers.filter((offer) => {
    if (statusFilter === "Все") return true;
    return offer.status === statusFilter;
  });

  const activeOffersCount = offers.filter(
    (offer) => offer.status === "Активно"
  ).length;

  const soldOffersCount = offers.filter(
    (offer) => offer.status === "Продано"
  ).length;

  const totalSales = offers
    .filter((offer) => offer.status === "Продано")
    .reduce((sum, offer) => sum + offer.price, 0);

  const removeOfferFromSale = (id: number) => {
    setOffers((previousOffers) =>
      previousOffers.map((offer) =>
        offer.id === id
          ? { ...offer, status: "Снято с продажи" }
          : offer
      )
    );
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
            Управляйте своими предложениями и продажами
          </p>

          {/* Статистика */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Активные предложения
              </p>
              <p className="mt-3 text-3xl font-black text-[#0057A8]">
                {activeOffersCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Проданные билеты
              </p>
              <p className="mt-3 text-3xl font-black text-[#0057A8]">
                {soldOffersCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Сумма продаж
              </p>
              <p className="mt-3 text-3xl font-black text-[#F28C28]">
                {totalSales.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>

          {/* Мои предложения */}
          <div className="mt-12">
            <h2 className="text-2xl font-black text-gray-900">
              Мои предложения
            </h2>

            {/* Фильтры */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: "Все", value: "Все" },
                { label: "Активные", value: "Активно" },
                { label: "Проданные", value: "Продано" },
                { label: "Снятые с продажи", value: "Снято с продажи" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    statusFilter === filter.value
                      ? "bg-[#0057A8] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Добавление предложения */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-5 rounded-xl bg-[#0057A8] px-6 py-3 font-bold text-white transition hover:bg-[#004580]"
            >
              + Добавить предложение
            </button>

            {showForm && (
              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-gray-900">
                  Новое предложение
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Соперник
                    </label>
                    <input
                      type="text"
                      value={newOffer.opponent}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          opponent: e.target.value,
                        })
                      }
                      placeholder="Например, Соперник 05"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Дата матча
                    </label>
                    <input
                      type="date"
                      value={newOffer.date}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          date: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Сектор
                    </label>
                    <select
                      value={newOffer.sector}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          sector: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    >
                      <option>Сектор A</option>
                      <option>Сектор B</option>
                      <option>Сектор C</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Ряд
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newOffer.row}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          row: e.target.value,
                        })
                      }
                      placeholder="Например, 3"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Место
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newOffer.seat}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          seat: e.target.value,
                        })
                      }
                      placeholder="Например, 12"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700">
                      Цена (₽)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newOffer.price}
                      onChange={(e) =>
                        setNewOffer({
                          ...newOffer,
                          price: e.target.value,
                        })
                      }
                      placeholder="Например, 1500"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (
                        !newOffer.opponent.trim() ||
                        !newOffer.date ||
                        !newOffer.row ||
                        !newOffer.seat ||
                        !newOffer.price
                      ) {
                        alert("Заполни все поля");
                        return;
                      }

                      const row = Number(newOffer.row);
                      const seat = Number(newOffer.seat);
                      const price = Number(newOffer.price);

                      if (
                        !Number.isInteger(row) ||
                        row <= 0 ||
                        !Number.isInteger(seat) ||
                        seat <= 0 ||
                        !Number.isInteger(price) ||
                        price <= 0
                      ) {
                        alert(
                          "Ряд, место и цена должны быть положительными целыми числами"
                        );
                        return;
                      }

                      setOffers((previousOffers) => [
                        ...previousOffers,
                        {
                          id:
                            Math.max(
                              0,
                              ...previousOffers.map((offer) => offer.id)
                            ) + 1,
                          opponent: newOffer.opponent.trim(),
                          date: newOffer.date,
                          sector: newOffer.sector,
                          row,
                          seat,
                          price,
                          status: "Активно",
                        },
                      ]);

                      setNewOffer({
                        opponent: "",
                        date: "",
                        sector: "Сектор A",
                        row: "",
                        seat: "",
                        price: "",
                      });

                      setShowForm(false);
                    }}
                    className="rounded-xl bg-[#0057A8] px-6 py-3 font-bold text-white hover:bg-[#004580]"
                  >
                    Сохранить предложение
                  </button>

                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Карточки предложений */}
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
                  <p className="text-lg font-semibold text-gray-700">
                    Предложений пока нет
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Здесь появятся билеты, соответствующие выбранному фильтру.
                  </p>
                </div>
              )}

              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#0057A8]">
                      {offer.opponent}
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        offer.status === "Активно"
                          ? "bg-green-100 text-green-700"
                          : offer.status === "Продано"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    {formatOfferDate(offer.date)}
                  </p>

                  <div className="mt-5 rounded-xl bg-[#F3F6FA] p-4">
                    <p className="font-bold">{offer.sector}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Ряд {offer.row} · Место {offer.seat}
                    </p>
                  </div>

                  {editingOfferId === offer.id && (
                    <div className="mt-5">
                      <label className="text-sm font-bold text-gray-700">
                        Новая цена (₽)
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-[#0057A8]"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const newPrice = Number(editedPrice);

                            if (
                              !Number.isInteger(newPrice) ||
                              newPrice <= 0
                            ) {
                              return;
                            }

                            setOffers((previousOffers) =>
                              previousOffers.map((item) =>
                                item.id === offer.id
                                  ? { ...item, price: newPrice }
                                  : item
                              )
                            );

                            setEditingOfferId(null);
                            setEditedPrice("");
                          }}
                          className="rounded-lg bg-[#0057A8] px-4 py-2 text-sm font-bold text-white hover:bg-[#004580]"
                        >
                          Сохранить
                        </button>

                        <button
                          onClick={() => {
                            setEditingOfferId(null);
                            setEditedPrice("");
                          }}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Цена и действия */}
                  <div className="mt-5 space-y-4">
                    <p className="text-2xl font-black text-gray-900">
                      {offer.price.toLocaleString("ru-RU")} ₽
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingOfferId(offer.id);
                          setEditedPrice(String(offer.price));
                        }}
                        className="rounded-lg border border-[#0057A8] px-3 py-2 text-xs font-bold text-[#0057A8] transition hover:bg-blue-50"
                      >
                        Редактировать
                      </button>

                      <button
                        onClick={() =>
                          setOffers((previousOffers) =>
                            previousOffers.filter(
                              (item) => item.id !== offer.id
                            )
                          )
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>

                      {offer.status === "Активно" && (
                        <button
                          onClick={() => removeOfferFromSale(offer.id)}
                          className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-50"
                        >
                          Снять с продажи
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
