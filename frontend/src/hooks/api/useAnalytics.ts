"use client";

import { useState, useEffect } from "react";

export enum TimeRange {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
  ALL = "all",
}

// Types for analytics data
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
  sessionFrequency: SessionFrequency;
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
  topic: string;
  accuracy: number;
  attempts: number;
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
  totalUsers: number;
}

interface SessionFrequency {
  daily: {
    count: number;
    percentage: number;
  };
  weekly: {
    count: number;
    percentage: number;
  };
  monthly: {
    count: number;
    percentage: number;
  };
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
        // In a real app, this would be an API call
        // await fetch(`/api/analytics?timeRange=${timeRange}`)

        // For demo purposes, we'll simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAnalytics(getMockAnalyticsData(timeRange));
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

// Mock data generator
function getMockAnalyticsData(timeRange: TimeRange): AnalyticsData {
  // Generate different data based on time range
  const multiplier =
    timeRange === TimeRange.TODAY
      ? 0.5
      : timeRange === TimeRange.WEEK
      ? 0.8
      : timeRange === TimeRange.MONTH
      ? 1.2
      : 1.5;

  return {
    learningEffectivenessScore: Math.round(
      78 * multiplier > 100 ? 100 : 78 * multiplier
    ),
    currentStreak: 12,
    longestStreak: 21,
    totalStudyTime: Math.round(48 * multiplier),
    averageSessionDuration: Math.round(25 * multiplier),
    studyTrendData: generateStudyTrendData(timeRange),
    responseQualityData: [
      { name: "Perfect", value: 35, color: "#4CAF50" },
      { name: "Good", value: 45, color: "#2196F3" },
      { name: "Fair", value: 15, color: "#FF9800" },
      { name: "Poor", value: 5, color: "#F44336" },
    ],
    streakData: generateStreakData(),
    quizVsStudyData: generateQuizVsStudyData(timeRange),
    difficultCardsData: [
      { id: "card1", topic: "Neural Networks", accuracy: 45, attempts: 12 },
      { id: "card2", topic: "Quantum Computing", accuracy: 52, attempts: 8 },
      { id: "card3", topic: "Blockchain", accuracy: 58, attempts: 10 },
    ],
    pointsData: [
      { name: "Quizzes", value: 450, color: "#FF9800" },
      { name: "Study", value: 680, color: "#2196F3" },
      { name: "Streak", value: 320, color: "#4CAF50" },
      { name: "Challenges", value: 250, color: "#9C27B0" },
    ],
    rankingData: {
      daily: 42,
      weekly: 38,
      monthly: 45,
      totalUsers: 1250,
    },
    sessionFrequency: {
      daily: {
        count: Math.round(3 * multiplier),
        percentage: Math.round(75 * multiplier > 100 ? 100 : 75 * multiplier),
      },
      weekly: {
        count: Math.round(18 * multiplier),
        percentage: Math.round(85 * multiplier > 100 ? 100 : 85 * multiplier),
      },
      monthly: {
        count: Math.round(65 * multiplier),
        percentage: Math.round(70 * multiplier > 100 ? 100 : 70 * multiplier),
      },
    },
  };
}

function generateStudyTrendData(timeRange: TimeRange): StudyTrendItem[] {
  const intervals =
    timeRange === TimeRange.TODAY
      ? ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"]
      : timeRange === TimeRange.WEEK
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : timeRange === TimeRange.MONTH
      ? ["Week 1", "Week 2", "Week 3", "Week 4"]
      : [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

  return intervals.map((interval, index) => ({
    interval,
    accuracy: Math.round(65 + Math.random() * 25),
    cardsStudied: Math.round(10 + Math.random() * 40),
    timeSpent: Math.round(15 + Math.random() * 45),
  }));
}

function generateStreakData(): StreakItem[] {
  const data: StreakItem[] = [];
  const today = new Date();

  // Generate 28 days (4 weeks) of streak data
  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (27 - i));

    // Format date as MM/DD
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

    // Random value between 0 and 1, with higher probability for recent days
    // and weekends have lower probability
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const recencyBoost = i / 28; // Higher for more recent days

    let value = 0;

    // 70% chance of having studied on weekdays, 40% on weekends
    // Recent days have higher probability
    if (Math.random() < (isWeekend ? 0.4 : 0.7) * (1 + recencyBoost)) {
      // If studied, random intensity between 0.2 and 1
      value = 0.2 + Math.random() * 0.8;
    }

    data.push({
      date: formattedDate,
      value,
    });
  }

  return data;
}

function generateQuizVsStudyData(timeRange: TimeRange): QuizVsStudyItem[] {
  const intervals =
    timeRange === TimeRange.TODAY
      ? 7 // Hours
      : timeRange === TimeRange.WEEK
      ? 7 // Days
      : timeRange === TimeRange.MONTH
      ? 4 // Weeks
      : 12; // Months

  const data: QuizVsStudyItem[] = [];

  for (let i = 0; i < intervals; i++) {
    const quizAccuracy = Math.round(60 + Math.random() * 25);
    // Study accuracy is generally higher than quiz accuracy
    const studyAccuracy = Math.min(
      100,
      quizAccuracy + 5 + Math.round(Math.random() * 15)
    );

    let date = "";
    if (timeRange === TimeRange.TODAY) {
      date = `${i * 3 + 8}:00`;
    } else if (timeRange === TimeRange.WEEK) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      date = days[i];
    } else if (timeRange === TimeRange.MONTH) {
      date = `Week ${i + 1}`;
    } else {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      date = months[i];
    }

    data.push({
      date,
      quizAccuracy,
      studyAccuracy,
    });
  }

  return data;
}
