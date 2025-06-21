export enum TimeFrame {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ALLTIME = "alltime",
}

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string;
  total_study_days: number;
  points_earned: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  name: string;
  description: string;
  achievement_type: string;
  criteria_met: Record<string, any>;
  points_awarded: number;
  achieved_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  total_points: number;
  username: string;
  avatar: string | null;
  streak: number;
}

export interface UserRankDetail {
  rank: number;
  points_to_next_rank: number | null;
  rank_change: string;
}

export interface Leaderboard {
  timeframe: TimeFrame;
  entries: LeaderboardEntry[];
  user_rank_details: UserRankDetail | null;
}

export interface UserGamificationSummary {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  achievement_count: number;
  rank: number | null;
}
