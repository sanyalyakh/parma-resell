export type ArenaLayout = {
  id: string;
  name: string;
  city: string;
  sectors: {
    id: string;
    position: "top" | "bottom" | "left" | "right";
  }[];
};

export const arenaLayouts: ArenaLayout[] = [
  {
    id: "molot",
    name: "УДС «Молот»",
    city: "Пермь",
    sectors: [
      { id: "A", position: "top" },
      { id: "B", position: "left" },
      { id: "C", position: "right" },
    ],
  },
  {
    id: "demo-arena",
    name: "Тестовая арена",
    city: "Другой город",
    sectors: [
      { id: "A", position: "top" },
      { id: "B", position: "left" },
      { id: "C", position: "right" },
      { id: "D", position: "bottom" },
    ],
  },
];