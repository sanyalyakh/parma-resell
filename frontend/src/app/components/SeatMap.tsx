"use client";

import { useState } from "react";

type SeatMapProps = {
  layout: {
    id: string;
    name: string;
    city: string;
    sectors: {
      id: string;
      position: "top" | "bottom" | "left" | "right";
    }[];
  };
  offers: {
    id: string;
    sector: string;
    row: number;
    seat: number;
    price: number;
  }[];
  seats: {
    id: string;
    sector: string;
    row: number;
    number: number;
    status: "available" | "active" | "reserved" | "sold";
  }[];
  selectedSector: string;
  selectedRow: number | null;
  selectedSeat: number | null;
  onSectorChange: (sector: string) => void;
  onRowChange: (row: number | null) => void;
  onSeatChange: (seat: number | null) => void;
};

export default function SeatMap({
  layout,
  offers,
  seats,
  selectedSector,
  selectedRow,
  selectedSeat,
  onSectorChange,
  onRowChange,
  onSeatChange,
}: SeatMapProps) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(false);
  const normalizeSector = (sector: string) =>
    sector.replace(/^Сектор\s+/i, "").trim();

  const sectorSeats = seats.filter(
    (seat) =>
      normalizeSector(seat.sector) === normalizeSector(selectedSector)
  );

  const selectedOffer = offers.find((offer) => normalizeSector(offer.sector) === normalizeSector(selectedSector) && offer.row === selectedRow && offer.seat === selectedSeat);

  const rows = [
    ...new Set(sectorSeats.map((seat) => seat.row)),
  ].sort((a, b) => a - b);

  const seatsInRow =
    selectedRow === null
      ? []
      : sectorSeats
          .filter((seat) => seat.row === selectedRow)
          .sort((a, b) => a.number - b.number);

  const getSeatClass = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return "border-[#F28C28] bg-[#F28C28] text-white";
    }

    switch (status) {
      case "active":
        return "border-[#0057A8] bg-[#0057A8] text-white hover:bg-[#004580]";
      case "reserved":
        return "border-[#F28C28] bg-[#F28C28] text-white cursor-not-allowed";
      case "sold":
        return "border-[#6B7280] bg-[#6B7280] text-white cursor-not-allowed";
      default:
        return "border-gray-200 bg-[#D1D5DB] text-gray-600 cursor-not-allowed";
    }
  };

  const handleSectorChange = (sector: string) => {
    onSectorChange(sector);
    onRowChange(null);
    onSeatChange(null);
  };

  const sectorButtonClass = (sectorId: string) =>
    `flex min-w-0 items-center justify-center rounded-xl border-2 font-black transition ${
      selectedSector === sectorId
        ? "border-[#0057A8] bg-[#0057A8] text-white"
        : "border-blue-100 bg-white text-[#0057A8] hover:border-[#0057A8]"
    }`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black sm:text-2xl">
          Выберите сектор
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Схема арены · демонстрационный вариант
        </p>
      </div>

      {/* Схема арены */}
      <div className="mx-auto max-w-2xl rounded-2xl bg-[#F3F6FA] p-2 sm:p-6">
        <div className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)_minmax(0,0.75fr)] gap-2 sm:gap-3">

          {/* Верхние сектора */}
          <div className="col-span-3 flex flex-wrap justify-center gap-2 sm:gap-3">
            {layout.sectors
              .filter((sector) => sector.position === "top")
              .map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorChange(sector.id)}
                  aria-pressed={selectedSector === sector.id}
                  className={`${sectorButtonClass(sector.id)} min-w-16 px-3 py-3 text-sm sm:min-w-24 sm:px-5 sm:py-6 sm:text-base`}
                >
                  {sector.id}
                </button>
              ))}
          </div>

          {/* Левые сектора */}
          <div className="flex flex-col justify-center gap-2 sm:gap-3">
            {layout.sectors
              .filter((sector) => sector.position === "left")
              .map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorChange(sector.id)}
                  aria-pressed={selectedSector === sector.id}
                  className={`${sectorButtonClass(sector.id)} min-h-16 px-1 py-4 text-sm sm:min-h-24 sm:px-3 sm:py-8 sm:text-base`}
                >
                  {sector.id}
                </button>
              ))}
          </div>

          {/* Баскетбольная площадка */}
          <div className="flex aspect-[4/3] w-full min-w-0 items-center justify-center rounded-lg border-2 border-[#F28C28] bg-[#F28C28]/10 p-1 sm:rounded-xl sm:p-2">
            <div className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-[#F28C28]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#F28C28] sm:h-12 sm:w-12">
                <span className="text-[8px] font-black text-[#0057A8] sm:text-[9px]">
                  PARMA
                </span>
              </div>

              <div className="text-center text-[7px] font-bold leading-tight text-gray-600 sm:text-[9px]">
                <p>БАСКЕТБОЛЬНАЯ</p>
                <p>ПЛОЩАДКА</p>
              </div>
            </div>
          </div>

          {/* Правые сектора */}
          <div className="flex flex-col justify-center gap-2 sm:gap-3">
            {layout.sectors
              .filter((sector) => sector.position === "right")
              .map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorChange(sector.id)}
                  aria-pressed={selectedSector === sector.id}
                  className={`${sectorButtonClass(sector.id)} min-h-16 px-1 py-4 text-sm sm:min-h-24 sm:px-3 sm:py-8 sm:text-base`}
                >
                  {sector.id}
                </button>
              ))}
          </div>

          {/* Нижние сектора */}
          <div className="col-span-3 flex flex-wrap justify-center gap-2 sm:gap-3">
            {layout.sectors
              .filter((sector) => sector.position === "bottom")
              .map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorChange(sector.id)}
                  aria-pressed={selectedSector === sector.id}
                  className={`${sectorButtonClass(sector.id)} min-w-16 px-3 py-3 text-sm sm:min-w-24 sm:px-5 sm:py-6 sm:text-base`}
                >
                  {sector.id}
                </button>
              ))}
          </div>
        </div>

        {/* Название арены */}
        <div className="mt-3 rounded-lg bg-white px-2 py-3 text-center text-[10px] font-bold tracking-wider text-gray-400 sm:mt-4 sm:text-xs sm:tracking-widest">
          {layout.name.toUpperCase()} · {layout.city.toUpperCase()}
        </div>
      </div>

      {/* Выбранный сектор */}
      <p className="mt-6 text-center text-sm text-gray-600 sm:text-base">
        Выбран сектор:{" "}
        <span className="font-black text-[#0057A8]">
          {selectedSector || "не выбран"}
        </span>
      </p>

      {/* Информация о выбранном месте */}
      {selectedSector && selectedRow !== null && selectedSeat !== null && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
          <h3 className="text-lg font-black text-gray-900">
            Выбранное место
          </h3>

          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Сектор {selectedSector} · Ряд {selectedRow} · Место {selectedSeat}
          </p>

          {offers.filter(
            (offer) =>
              normalizeSector(offer.sector) === selectedSector &&
              offer.row === selectedRow &&
              offer.seat === selectedSeat
          )
            .map((offer) => (
              <div
                key={offer.id}
                className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-2xl font-black text-[#0057A8]">
                    {offer.price.toLocaleString("ru-RU")} ₽
                  </span>

                  <p className="mt-1 text-sm text-gray-500">
                    Предложение №{offer.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentNotice(false);
                    setIsPurchaseModalOpen(true);
                  }}
                  className="w-full rounded-xl bg-[#F28C28] px-6 py-3 font-bold text-white transition hover:bg-[#e47b19] sm:w-auto"
                >
                  Перейти к покупке
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Выбор ряда */}
      {selectedSector && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-black sm:text-xl">
            Выберите ряд
          </h3>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {rows.map((row) => (
              <button
                key={row}
                onClick={() => {
                  onRowChange(row);
                  onSeatChange(null);
                }}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-bold transition sm:px-5 sm:text-base ${
                  selectedRow === row
                    ? "border-[#0057A8] bg-[#0057A8] text-white"
                    : "border-gray-200 bg-white text-[#0057A8] hover:border-[#0057A8]"
                }`}
              >
                {row}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор места */}
      {seatsInRow.map((seat) => {
        const isSelected = selectedSeat === seat.number;
        const isAvailable = seat.status === "active";

        return (
          <button
            key={seat.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSeatChange(seat.number)}
            className={`h-11 w-11 rounded-lg border-2 text-sm font-bold transition sm:h-12 sm:w-12 sm:text-base disabled:opacity-100 ${getSeatClass(
              seat.status,
              isSelected
            )}`}
            title={
              seat.status === "active"
                ? "Можно купить"
                : seat.status === "reserved"
                  ? "Забронировано"
                  : seat.status === "sold"
                    ? "Продано"
                    : "Нет предложения"
            }
          >
            {seat.number}
          </button>
        );
      })}
      {/* Модальное окно подтверждения заказа */}
      {isPurchaseModalOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          style={{ animation: "purchaseOverlayIn 180ms ease-out" }}
          onClick={() => setIsPurchaseModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-modal-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            style={{
              animation:
                "purchaseModalIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              aria-label="Закрыть окно"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>

            <p className="text-sm font-bold uppercase tracking-widest text-[#F28C28]">
              PARMA RESELL
            </p>

            <h2
              id="purchase-modal-title"
              className="mt-2 text-2xl font-black text-gray-900"
            >
              Подтверждение заказа
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Проверьте выбранное место и сумму заказа.
            </p>

            {/* Информация о заказе */}
            <div className="mt-6 rounded-xl bg-[#F3F6FA] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Выбранное место
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Сектор</span>
                  <span className="font-bold text-gray-900">
                    {selectedOffer.sector}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Ряд</span>
                  <span className="font-bold text-gray-900">
                    {selectedOffer.row}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Место</span>
                  <span className="font-bold text-gray-900">
                    {selectedOffer.seat}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-500">
                  Сумма заказа
                </p>

                <p className="mt-1 text-3xl font-black text-[#0057A8]">
                  {selectedOffer.price.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>

            {/* Кнопка оплаты */}
            <button
              type="button"
              onClick={() => setPaymentNotice(true)}
              className="mt-6 w-full rounded-xl bg-[#F28C28] px-6 py-4 font-bold text-white transition hover:bg-[#e47b19] active:scale-[0.98]"
            >
              Оплатить
            </button>

            {paymentNotice && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-[#0057A8]"
              >
                Переход к оплате будет подключён после определения схемы
                интеграции с билетным оператором.
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="mt-3 w-full rounded-xl px-6 py-3 text-sm font-bold text-gray-500 transition hover:bg-gray-100"
            >
              Вернуться к выбору места
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
