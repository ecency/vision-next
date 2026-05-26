export interface LeaderBoardItem {
  _id: string;
  count: number;
  points: string;
  /** true when the user completed all of today's daily quests (recognition badge) */
  quests_done?: boolean;
}

export type LeaderBoardDuration = "day" | "week" | "month";
