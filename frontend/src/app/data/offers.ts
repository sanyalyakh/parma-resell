export type Offer = {
  id: number;
  matchId: number;
  sector: string;
  row: number;
  seat: number;
  price: number;
};

export const offers: Offer[] = [
  {
    id: 1,
    matchId: 1,
    sector: "Сектор A",
    row: 3,
    seat: 12,
    price: 1500,
  },
  {
    id: 3,
    matchId: 1,
    sector: "Сектор B",
    row: 5,
    seat: 8,
    price: 1000,
  },
  {
    id: 2,
    matchId: 1,
    sector: "Сектор B",
    row: 2,
    seat: 15,
    price: 1700,
  },
  {
    id: 4,
    matchId: 1,
    sector: "Сектор C",
    row: 2,
    seat: 15,
    price: 1200,
  },
  {
    id: 5,
    matchId: 1,
    sector: "Сектор C",
    row: 3,
    seat: 10,
    price: 1800,
  },
    {
    id: 6,
    matchId: 2,
    sector: "Сектор A",
    row: 2,
    seat: 5,
    price: 1300,
  },
  {
    id: 7,
    matchId: 2,
    sector: "Сектор B",
    row: 4,
    seat: 10,
    price: 1600,
  },
];