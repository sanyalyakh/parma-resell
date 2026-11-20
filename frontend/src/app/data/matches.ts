export type Match = {
  id: string;
  home_club: {
    id: string;
    name: string;
  };
  away_club: {
    id: string;
    name: string;
  };
  starts_at: string;
  competition: string;
  match_type: "home" | "away";
  status: "scheduled" | "live" | "finished" | "cancelled";
  arena: {
    id: string;
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
