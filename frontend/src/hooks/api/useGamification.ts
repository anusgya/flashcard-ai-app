import useSWR from "swr";
import { fetchWithAuth } from "./fetchWithAuth";
import {
  DailyStreak,
  Achievement,
  Leaderboard,
  UserGamificationSummary,
  TimeFrame,
} from "@/types/gamification";

const GAMIFICATION_API_BASE = "/api/gamification";

export const useStreak = () => {
  const { data, error, isLoading, mutate } = useSWR<DailyStreak>(
    `${GAMIFICATION_API_BASE}/streaks`,
    fetchWithAuth
  );

  return {
    streak: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const updateStreak = async (): Promise<DailyStreak> => {
  return fetchWithAuth(`${GAMIFICATION_API_BASE}/streaks/update`, {
    method: "POST",
  });
};

export const useAchievements = () => {
  const { data, error, isLoading } = useSWR<Achievement[]>(
    `${GAMIFICATION_API_BASE}/achievements`,
    fetchWithAuth
  );

  return {
    achievements: data,
    isLoading,
    isError: error,
  };
};

export const useLeaderboard = (timeframe: TimeFrame, limit: number = 10) => {
  const { data, error, isLoading } = useSWR<Leaderboard>(
    `${GAMIFICATION_API_BASE}/leaderboard/${timeframe}?limit=${limit}`,
    fetchWithAuth
  );

  return {
    leaderboard: data,
    isLoading,
    isError: error,
  };
};

export const useGamificationSummary = () => {
  const { data, error, isLoading } = useSWR<UserGamificationSummary>(
    `${GAMIFICATION_API_BASE}/summary`,
    fetchWithAuth
  );

  return {
    summary: data,
    isLoading,
    isError: error,
  };
};
