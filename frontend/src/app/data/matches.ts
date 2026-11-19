export type Match = {
  id: number;
  home_club: {
    id: number;
    name: string;
  };
  away_club: {
    id: number;
    name: string;
  };
  starts_at: string;
  competition: string;
  match_type: "home" | "away";
  status: "scheduled" | "live" | "finished" | "cancelled";
  arena: {
    id: number;
    name: string;
    city: string;
  };
};

export type MatchesResponse = {
  items: Match[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
  };
};
