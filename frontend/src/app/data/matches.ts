export type Match = {
  id: number;
  opponent: string;
  date: string;
  time: string;
  tournament: string;
  hasOffers: boolean;
  arenaId: string;
  matchType: "home" | "away";
  venue: string;
};

export const matches: Match[] = [
  {
    id: 1,
    opponent: "Соперник 01",
    date: "15 декабря",
    time: "19:00",
    tournament: "Единая Лига ВТБ",
    hasOffers: true,
    arenaId: "molot",
    matchType: "home",
    venue: "УДС «Молот»",
  },
  {
    id: 2,
    opponent: "Соперник 02",
    date: "05 января",
    time: "19:00",
    tournament: "Единая Лига ВТБ",
    hasOffers: true,
    arenaId: "demo-arena",
    matchType: "away",
    venue: "Тестовая арена",
  },
  {
    id: 3,
    opponent: "Соперник 03",
    date: "15 января",
    time: "19:00",
    tournament: "Единая Лига ВТБ",
    hasOffers: true,
    arenaId: "molot",
    matchType: "home",
    venue: "УДС «Молот»",
  },
  {
    id: 4,
    opponent: "Соперник 04",
    date: "25 января",
    time: "19:00",
    tournament: "Единая Лига ВТБ",
    hasOffers: false,
    arenaId: "molot",
    matchType: "home",
    venue: "УДС «Молот»",
  },
];
