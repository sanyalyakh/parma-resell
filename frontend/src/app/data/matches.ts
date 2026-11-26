export type Match = {
  id: string;
  club_id: string;
  venue_id: string;
  opponent: string;
  starts_at: string;
  status: "scheduled" | "live" | "finished" | "cancelled";
};

export type MatchesResponse = {
  items: Match[];
  limit: number;
  offset: number;
};
