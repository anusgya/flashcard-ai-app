"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "./fetchWithAuth"; // Assuming fetchWithAuth is in the same directory

export enum TimeRange {
  WEEK = "week",
  MONTH = "month",
  ALL = "all",
}

// Types for analytics data, aligned with backend schemas
export interface AnalyticsData {
  learningEffectivenessScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number;
  averageSessionDuration: number;
  studyTrendData: StudyTrendItem[];
  responseQualityData: ResponseQualityItem[];
  streakData: StreakItem[];
  quizVsStudyData: QuizVsStudyItem[];
  difficultCardsData: DifficultCardItem[];
  pointsData: PointsItem[];
  rankingData: RankingData;
  sessionFrequency: SessionFrequencyData;
}

interface StudyTrendItem {
  interval: string;
  accuracy: number;
  cardsStudied: number;
  timeSpent: number;
}

interface ResponseQualityItem {
  name: string;
  value: number;
  color: string;
}

interface StreakItem {
  date: string;
  value: number;
}

interface QuizVsStudyItem {
  date: string;
  quizAccuracy: number;
  studyAccuracy: number;
}

interface DifficultCardItem {
  id: string;
  front_content: string; // Changed from 'topic'
  success_rate: number; // Changed from 'accuracy'
  total_reviews: number; // Changed from 'attempts'
}

interface PointsItem {
  name: string;
  value: number;
  color: string;
}

interface RankingData {
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number; // Added allTime
  totalUsers: number;
}

interface SessionFrequency {
  count: number;
  percentage: number;
}

interface SessionFrequencyData {
  daily: SessionFrequency;
  weekly: SessionFrequency;
  monthly: SessionFrequency;
}

export const useAnalyticsDashboard = (timeRange: TimeRange) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const data = await fetchWithAuth(
          `/api/analytics/dashboard?time_range=${timeRange}`
        );
        if (!data) {
          throw new Error("Failed to fetch analytics data");
        }
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  return { analytics, isLoading, isError };
};
