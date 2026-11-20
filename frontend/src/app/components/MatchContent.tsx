
"use client";

import { useState } from "react";
import SeatMap from "./SeatMap";

type MatchContentProps = {
  arena: {
    id: string;
    name: string;
    city: string;
    sectors: {
      id: string;
      position: "top" | "bottom" | "left" | "right";
    }[];
  };
  offers: {
    id: number;
    sector: string;
    row: number;
    seat: number;
    price: number;
  }[];
  seats: {
    id: number;
    sector: string;
    row: number;
    number: number;
    status: "available" | "active" | "reserved" | "sold";
  }[];
};

const normalizeSector = (sector: string) =>
  sector.replace(/^Сектор\s+/i, "").trim();

export default function MatchContent({
  arena,
  offers,
  seats,
}: MatchContentProps) {
  const [selectedSector, setSelectedSector] = useState(
    arena.sectors[0]?.id ?? ""
  );

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredOffers = offers.filter(
    (offer) =>
      normalizeSector(offer.sector) ===
      normalizeSector(selectedSector)
  );

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    return sortOrder === "asc"
      ? a.price - b.price
      : b.price - a.price;
  });

  return (
    <div>
      <SeatMap
        layout={arena}
        offers={offers}
        seats={seats}
        selectedSector={selectedSector}
        selectedRow={selectedRow}
        selectedSeat={selectedSeat}
        onSectorChange={setSelectedSector}
        onRowChange={setSelectedRow}
        onSeatChange={setSelectedSeat}
      />

      <div className="mt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-black">
            Доступные предложения
          </h2>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
              {filteredOffers.length} шт.
            </span>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "asc" | "desc")
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#0057A8]"
            >
              <option value="asc">Сначала дешевле</option>
              <option value="desc">Сначала дороже</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sortedOffers.map((offer) => {
            const isSelected =
              normalizeSector(selectedSector) ===
                normalizeSector(offer.sector) &&
              selectedRow === offer.row &&
              selectedSeat === offer.seat;

            return (
              <div
                key={offer.id}
                className={`rounded-xl border-2 p-6 transition ${
                  isSelected
                    ? "border-[#F28C28] bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <p className="text-lg font-bold">
                  {offer.sector}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Ряд: {offer.row} · Место: {offer.seat}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xl font-black text-[#0057A8]">
                    {offer.price} ₽
                  </span>

                  <button
                    onClick={() => {
                      setSelectedSector(
                        normalizeSector(offer.sector)
                      );
                      setSelectedRow(offer.row);
                      setSelectedSeat(offer.seat);
                    }}
                    className="rounded-lg bg-[#0057A8] px-4 py-2 font-bold text-white transition hover:bg-[#004580]"
                  >
                    {isSelected ? "Выбрано" : "На схеме"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOffers.length === 0 && (
          <p className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
            В выбранном секторе пока нет предложений.
          </p>
        )}
      </div>
    </div>
  );
}
