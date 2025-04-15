// hooks/api/useAnalytics.ts
import useSWR from 'swr';
import { fetcher } from './fetchWithAuth';
import { useCallback } from 'react';
import {
  StudySession,
  QuizSession,
  StudySessionStats,
  QuizSessionStats,
  DailyStreak,
  LeaderboardResponse,
  UserGamificationSummary,
  AnalyticsDashboardData,
  StudyRecord,
  ResponseQualityDataPoint,
  StudyTrendDataPoint,
  QuizVsStudyDataPoint,
  DifficultCardDataPoint,
  SessionFrequency,
  OptimalStudyPatterns,
  PointsDataPoint
} from '@/types/analytics';

// Define TimeRange enum for better type safety and readability
export enum TimeRange {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
  ALL = "all"
}

// Additional interface definitions needed but not imported
interface StreakDataPoint {
  day: string;
  date: string;
  value: number;
}

interface StudyRecordWithCardId extends StudyRecord {
  card_id: string;
  response_quality: string;
  time_taken: number;
}

interface StudySessionWithRecords extends StudySession {
  records?: StudyRecordWithCardId[];
  // Remove the redefinitions of start_time and end_time
  // Remove the redefinitions of accuracy and cards_studied as they already exist in StudySession
}

interface IntervalPerformance {
  interval: string;
  accuracy: number;
  timeSpent: number;
  cardsStudied: number;
  sessionCount: number;
}

interface CardPerformance {
  cardId: string;
  responses: string[];
  timeTaken: number[];
}

interface CardMetric {
  card: string;
  accuracy: number;
  timeSpent: number;
}

interface HourlyPerformance {
  [hour: number]: {
    accuracy: number;
    count: number;
  };
}

interface HourlyAverage {
  hour: number;
  avgAccuracy: number;
}

interface LengthPerformance {
  short: { accuracy: number; count: number };
  medium: { accuracy: number; count: number };
  long: { accuracy: number; count: number };
}

interface ResponseCounts {
  again: number;
  hard: number;
  good: number;
  perfect: number;
  [key: string]: number; // Index signature for dynamic access
}

// Study Session Analytics
export function useStudySessions(timeRange: TimeRange = TimeRange.TODAY) {
  const { data, error, isLoading, mutate } = useSWR<StudySessionWithRecords[]>(
    `/api/study/sessions?time_range=${timeRange}`,
    fetcher
  );

  return {
    studySessions: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useStudySessionStats(deckId?: string) {
  const { data, error, isLoading } = useSWR<StudySessionStats>(
    deckId ? `/api/study/stats/${deckId}` : null,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}

// Quiz Analytics
export function useQuizSessions(timeRange: TimeRange = TimeRange.TODAY) {
  const { data, error, isLoading, mutate } = useSWR<QuizSession[]>(
    `/api/quiz/sessions?time_range=${timeRange}`,
    fetcher
  );

  return {
    quizSessions: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useQuizSessionStats(deckId?: string) {
  const { data, error, isLoading } = useSWR<QuizSessionStats>(
    deckId ? `/api/quiz/stats/${deckId}` : null,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}

export function useUserStreak() {
  const { data, error, isLoading } = useSWR<DailyStreak>(
    '/api/gamification/streaks',
    fetcher
  );

  return {
    streak: data,
    isLoading,
    isError: error,
  };
}

export function useLeaderboard(timeframe: string = 'weekly', limit: number = 10) {
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/gamification/leaderboard/${timeframe}?limit=${limit}`,
    fetcher
  );

  return {
    leaderboard: data,
    isLoading,
    isError: error,
  };
}

export function useGamificationSummary() {
  const { data, error, isLoading } = useSWR<UserGamificationSummary>(
    '/api/gamification/summary',
    fetcher
  );

  return {
    summary: data,
    isLoading,
    isError: error,
  };
}

// Helper functions with proper type annotations
function computeResponseQualityDistribution(studySessions: StudySessionWithRecords[]): ResponseQualityDataPoint[] {
  const totalRecords = studySessions.reduce((sum, session) => sum + (session.records?.length || 0), 0);
  
  if (totalRecords === 0) {
    return [
      { name: 'Again', value: 0, color: '#ef4444' },
      { name: 'Hard', value: 0, color: '#f97316' },
      { name: 'Good', value: 0, color: '#22c55e' },
      { name: 'Perfect', value: 0, color: '#3b82f6' }
    ];
  }
  
  const counts: ResponseCounts = { again: 0, hard: 0, good: 0, perfect: 0 };
  
  studySessions.forEach(session => {
    if (session.records) {
      session.records.forEach(record => {
        const quality = record.response_quality.toLowerCase();
        if (quality in counts) {
          counts[quality]++;
        }
      });
    }
  });
  
  return [
    { name: 'Again', value: (counts.again / totalRecords) * 100, color: '#ef4444' },
    { name: 'Hard', value: (counts.hard / totalRecords) * 100, color: '#f97316' },
    { name: 'Good', value: (counts.good / totalRecords) * 100, color: '#22c55e' },
    { name: 'Perfect', value: (counts.perfect / totalRecords) * 100, color: '#3b82f6' }
  ];
}

function computeStudyTrends(studySessions: StudySessionWithRecords[], timeRange: TimeRange): StudyTrendDataPoint[] {
  // Group sessions by week/month based on timeRange
  const interval = timeRange === TimeRange.WEEK || timeRange === TimeRange.TODAY ? 'day' : 'week';
  const intervalMap: Record<string, IntervalPerformance> = {};
  
  studySessions.forEach(session => {
    if (!session.start_time) return;
    
    const date = new Date(session.start_time);
    const key = interval === 'day' 
      ? date.toISOString().substring(0, 10) 
      : `Week ${Math.ceil((date.getDate()) / 7)} of ${date.toLocaleString('default', { month: 'short' })}`;
    
    if (!intervalMap[key]) {
      intervalMap[key] = {
        interval: key,
        accuracy: 0,
        timeSpent: 0,
        cardsStudied: 0,
        sessionCount: 0
      };
    }
    
    intervalMap[key].accuracy += session.accuracy || 0;
    intervalMap[key].cardsStudied += session.cards_studied || 0;
    
    if (session.end_time && session.start_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      const timeSpentMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      intervalMap[key].timeSpent += timeSpentMinutes;
    }
    
    intervalMap[key].sessionCount += 1;
  });
  
  // Calculate averages for each interval
  return Object.values(intervalMap).map(item => ({
    interval: item.interval,
    accuracy: item.sessionCount > 0 ? Math.round((item.accuracy / item.sessionCount) * 100) : 0,
    timeSpent: Math.round(item.timeSpent),
    cardsStudied: item.cardsStudied
  }));
}

function computeStreakCalendar(streakData: DailyStreak): StreakDataPoint[] {
  // Generate data for the past 14 days
  const calendar: StreakDataPoint[] = [];
  const today: Date = new Date();
  const lastStudyDate: Date | null = streakData.last_study_date ? new Date(streakData.last_study_date) : null;
  
  for (let i: number = 13; i >= 0; i--) {
    const date: Date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayName: string = date.toLocaleString('default', { weekday: 'short' });
    const dateString: string = date.toISOString().substring(0, 10);
    
    let hasStudied: boolean = false;
    
    if (lastStudyDate) {
      // If there's a streak and the date is on or before lastStudyDate and within the current streak range
      const daysDiff: number = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      hasStudied = date <= lastStudyDate && daysDiff < streakData.current_streak;
    }
    
    calendar.push({
      day: dayName,
      date: dateString,
      value: hasStudied ? 1 : 0
    });
  }
  
  return calendar;
}

function computeQuizVsStudyPerformance(
  studySessions: StudySessionWithRecords[] | null,
  quizSessions: QuizSession[] | null,
  timeRange: TimeRange
): QuizVsStudyDataPoint[] {
  // Group by month (or week for shorter timeframes)
  const interval = timeRange === TimeRange.WEEK || timeRange === TimeRange.TODAY ? 'week' : 'month';
  const studyMap: Record<string, { accuracy: number, count: number }> = {};
  const quizMap: Record<string, { accuracy: number, count: number }> = {};
  
  // Process study sessions
  if (studySessions) {
    studySessions.forEach(session => {
      if (!session.start_time) return;
      
      const date = new Date(session.start_time);
      const key = interval === 'week' 
        ? `Week ${Math.ceil((date.getDate()) / 7)}` 
        : date.toLocaleString('default', { month: 'short' });
      
      if (!studyMap[key]) {
        studyMap[key] = { accuracy: 0, count: 0 };
      }
      
      studyMap[key].accuracy += session.accuracy || 0;
      studyMap[key].count += 1;
    });
  }
  
  // Process quiz sessions
  if (quizSessions) {
    quizSessions.forEach(session => {
      if (!session.start_time) return;
      
      const date = new Date(session.start_time);
      const key = interval === 'week' 
        ? `Week ${Math.ceil((date.getDate()) / 7)}` 
        : date.toLocaleString('default', { month: 'short' });
      
      if (!quizMap[key]) {
        quizMap[key] = { accuracy: 0, count: 0 };
      }
      
      quizMap[key].accuracy += session.accuracy || 0;
      quizMap[key].count += 1;
    });
  }
  
  // Combine the data
  const allKeys = [...new Set([...Object.keys(studyMap), ...Object.keys(quizMap)])].sort();
  
  return allKeys.map(key => ({
    date: key,
    studyAccuracy: studyMap[key]?.count > 0 ? Math.round((studyMap[key].accuracy / studyMap[key].count) * 100) : null,
    quizAccuracy: quizMap[key]?.count > 0 ? Math.round((quizMap[key].accuracy / quizMap[key].count) * 100) : null
  }));
}

function computeDifficultCards(studySessions: StudySessionWithRecords[]): DifficultCardDataPoint[] {
  // Track performance by card
  const cardPerformance: Record<string, CardPerformance> = {};
  
  studySessions.forEach(session => {
    if (session.records) {
      session.records.forEach(record => {
        const cardId = record.card_id;
        
        if (!cardPerformance[cardId]) {
          cardPerformance[cardId] = {
            cardId,
            responses: [],
            timeTaken: []
          };
        }
        
        cardPerformance[cardId].responses.push(record.response_quality);
        cardPerformance[cardId].timeTaken.push(record.time_taken);
      });
    }
  });
  
  // Calculate accuracy and average time for each card
  const cardMetrics: CardMetric[] = Object.values(cardPerformance).map(card => {
    const totalResponses = card.responses.length;
    const goodOrPerfectCount = card.responses.filter(
      r => r.toLowerCase() === 'good' || r.toLowerCase() === 'perfect'
    ).length;
    
    const accuracy = totalResponses > 0 ? (goodOrPerfectCount / totalResponses) * 100 : 0;
    const avgTime = card.timeTaken.length > 0 
      ? card.timeTaken.reduce((sum, time) => sum + time, 0) / card.timeTaken.length 
      : 0;
    
    return {
      card: `Card ${card.cardId.substring(0, 6)}...`,
      accuracy: Math.round(accuracy),
      timeSpent: Math.round(avgTime)
    };
  });
  
  // Sort by accuracy (ascending) and take the top 5 most difficult
  return cardMetrics
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
}

function computeSessionFrequency(
  studySessions: StudySessionWithRecords[] | null,
  quizSessions: QuizSession[] | null
): SessionFrequency {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  
  // Count sessions in different time periods
  let dailySessions = 0;
  let weeklySessions = 0;
  let monthlySessions = 0;
  
  // Count study sessions
  if (studySessions) {
    studySessions.forEach(session => {
      if (!session.start_time) return;
      
      const sessionDate = new Date(session.start_time);
      const diffTime = now.getTime() - sessionDate.getTime();
      
      if (diffTime <= oneDay) dailySessions++;
      if (diffTime <= oneWeek) weeklySessions++;
      if (diffTime <= oneMonth) monthlySessions++;
    });
  }
  
  // Count quiz sessions
  if (quizSessions) {
    quizSessions.forEach(session => {
      if (!session.start_time) return;
      
      const sessionDate = new Date(session.start_time);
      const diffTime = now.getTime() - sessionDate.getTime();
      
      if (diffTime <= oneDay) dailySessions++;
      if (diffTime <= oneWeek) weeklySessions++;
      if (diffTime <= oneMonth) monthlySessions++;
    });
  }
  
  // Calculate percentages relative to "ideal" values
  // Assumptions: ideal daily = 3, weekly = 15, monthly = 60
  const dailyPercentage = Math.min(dailySessions / 3 * 100, 100);
  const weeklyPercentage = Math.min(weeklySessions / 15 * 100, 100);
  const monthlyPercentage = Math.min(monthlySessions / 60 * 100, 100);
  
  return {
    daily: {
      count: dailySessions,
      percentage: dailyPercentage
    },
    weekly: {
      count: weeklySessions,
      percentage: weeklyPercentage
    },
    monthly: {
      count: monthlySessions,
      percentage: monthlyPercentage
    }
  };
}

function computeOptimalStudyPatterns(studySessions: StudySessionWithRecords[] | null): OptimalStudyPatterns {
  if (!studySessions || studySessions.length === 0) {
    return {
      bestTime: "8:00 PM - 10:00 PM",
      idealLength: "25-30 minutes",
      reviewInterval: "Every 3 days",
      cardsPerSession: "15-20 cards"
    };
  }
  
  // Track performance by hour of day
  const hourlyPerformance: HourlyPerformance = {};
  
  // Track session length performance
  const lengthPerformance: LengthPerformance = {
    short: { accuracy: 0, count: 0 }, // < 15 min
    medium: { accuracy: 0, count: 0 }, // 15-30 min
    long: { accuracy: 0, count: 0 } // > 30 min
  };
  
  studySessions.forEach(session => {
    if (session.start_time && session.end_time && session.accuracy !== undefined) {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      const hour = startTime.getHours();
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Track hourly performance
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { accuracy: 0, count: 0 };
      }
      
      hourlyPerformance[hour].accuracy += session.accuracy;
      hourlyPerformance[hour].count += 1;
      
      // Track session length performance
      const category = durationMinutes < 15 ? 'short' : durationMinutes <= 30 ? 'medium' : 'long';
      lengthPerformance[category].accuracy += session.accuracy;
      lengthPerformance[category].count += 1;
    }
  });
  
  // Find best hour range
  const hourlyAvgs: HourlyAverage[] = Object.entries(hourlyPerformance).map(([hour, data]) => ({
    hour: parseInt(hour),
    avgAccuracy: data.count > 0 ? data.accuracy / data.count : 0
  })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);
  
  let bestTime = "No data available";
  if (hourlyAvgs.length > 0) {
    const bestHour = hourlyAvgs[0].hour;
    bestTime = `${bestHour % 12 || 12}:00 ${bestHour < 12 ? 'AM' : 'PM'} - ${(bestHour + 2) % 12 || 12}:00 ${(bestHour + 2) < 12 ? 'AM' : 'PM'}`;
  }
  
  // Find best session length
  let idealLength = "25-30 minutes";
  if (lengthPerformance.short.count > 0 && lengthPerformance.medium.count > 0 && lengthPerformance.long.count > 0) {
    const shortAvg = lengthPerformance.short.accuracy / lengthPerformance.short.count;
    const mediumAvg = lengthPerformance.medium.accuracy / lengthPerformance.medium.count;
    const longAvg = lengthPerformance.long.accuracy / lengthPerformance.long.count;
    
    if (shortAvg > mediumAvg && shortAvg > longAvg) {
      idealLength = "10-15 minutes";
    } else if (mediumAvg > shortAvg && mediumAvg > longAvg) {
      idealLength = "15-30 minutes";
    } else {
      idealLength = "30-45 minutes";
    }
  }
  
  // For review interval and cards per session, we could calculate from data
  // but for simplicity, we'll use reasonable defaults
  return {
    bestTime,
    idealLength,
    reviewInterval: "Every 3 days", // This would ideally be calculated from actual review success rates
    cardsPerSession: "15-20 cards" // This would ideally be calculated from most successful session sizes
  };
}

function calculateTotalStudyTime(studySessions: StudySessionWithRecords[] | null): number {
  if (!studySessions || studySessions.length === 0) {
    return 0;
  }
  
  let totalMinutes = 0;
  
  studySessions.forEach(session => {
    if (session.start_time && session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      const sessionMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      totalMinutes += sessionMinutes;
    }
  });
  
  // Convert to hours, rounded to 1 decimal place
  return Math.round(totalMinutes / 6) / 10;
}

function calculateAverageSessionDuration(studySessions: StudySessionWithRecords[] | null): number {
  if (!studySessions || studySessions.length === 0) {
    return 0;
  }
  
  let totalMinutes = 0;
  let sessionsWithDuration = 0;
  
  studySessions.forEach(session => {
    if (session.start_time && session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      const sessionMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      totalMinutes += sessionMinutes;
      sessionsWithDuration++;
    }
  });
  
  return sessionsWithDuration > 0 ? Math.round(totalMinutes / sessionsWithDuration) : 0;
}

// Combined Analytics for Dashboard
export function useAnalyticsDashboard(timeRange: TimeRange = TimeRange.TODAY): {
  analytics: AnalyticsDashboardData | null;
  isLoading: boolean;
  isError: any;
} {
  // Fetch all the data needed for the dashboard
  const { studySessions, isLoading: studyLoading, isError: studyError } = useStudySessions(timeRange);
  const { quizSessions, isLoading: quizLoading, isError: quizError } = useQuizSessions(timeRange);
  const { streak, isLoading: streakLoading, isError: streakError } = useUserStreak();
  const { summary, isLoading: summaryLoading, isError: summaryError } = useGamificationSummary();
  const { leaderboard, isLoading: leaderboardLoading, isError: leaderboardError } = useLeaderboard('weekly');

  // Function to compute all necessary analytics
  const computeAnalytics = useCallback((): AnalyticsDashboardData | null => {
    if (studyLoading || quizLoading || streakLoading || summaryLoading || leaderboardLoading) {
      return null;
    }

    if (studyError || quizError || streakError || summaryError || leaderboardError) {
      // Return null instead of an error object
      return null;
    }

    // Calculate learning effectiveness score (example calculation)
    const studyAccuracy = studySessions && studySessions.length > 0 
      ? studySessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / studySessions.length 
      : 0;
    
    const quizAccuracy = quizSessions && quizSessions.length > 0 
      ? quizSessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / quizSessions.length 
      : 0;

    const learningEffectivenessScore = Math.round((studyAccuracy * 0.6 + quizAccuracy * 0.4) * 100);

    // Prepare response quality distribution data
    const responseQualityData = studySessions && studySessions.length > 0 
      ? computeResponseQualityDistribution(studySessions) 
      : [];

    // Calculate study trends for chart
    const studyTrendData = studySessions && studySessions.length > 0 
      ? computeStudyTrends(studySessions, timeRange) 
      : [];

    // Calculate streak data
    const streakData = streak ? computeStreakCalendar(streak) : [];

    // Compare quiz vs study performance
    const quizVsStudyData = computeQuizVsStudyPerformance(studySessions || [], quizSessions || [], timeRange);

    // Calculate difficult cards
    const difficultCardsData = studySessions && studySessions.length > 0 
      ? computeDifficultCards(studySessions) 
      : [];

    // Points distribution
    const pointsData: PointsDataPoint[] = summary ? [
      { name: 'Study', value: summary.study_points || 0, color: '#3b82f6' },
      { name: 'Quiz', value: summary.quiz_points || 0, color: '#8b5cf6' },
      { name: 'Streaks', value: summary.streak_points || 0, color: '#f97316' }
    ] : [];

    // Calculate session frequency
    const sessionFrequency = computeSessionFrequency(studySessions || [], quizSessions || []);
    
    // Calculate optimal study patterns
    const optimalStudyPatterns = computeOptimalStudyPatterns(studySessions || []);

    return {
      learningEffectivenessScore,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      totalStudyTime: calculateTotalStudyTime(studySessions || []),
      averageSessionDuration: calculateAverageSessionDuration(studySessions || []),
      rank: summary?.rank || 0,
      totalUsers: 100, // Placeholder, replace with actual data if available
      studyTrendData,
      responseQualityData,
      streakData,
      quizVsStudyData,
      difficultCardsData,
      pointsData,
      rankingData: {
        daily: leaderboard?.user_rank || 0,
        weekly: summary?.rank || 0,
        monthly: 0, // Placeholder, replace with actual data if available
        allTime: 0, // Placeholder, replace with actual data if available
        totalUsers: 100 // Placeholder, replace with actual data if available
      },
      sessionFrequency,
      optimalStudyPatterns
    } as AnalyticsDashboardData;
  }, [
    studySessions, quizSessions, streak, summary, leaderboard,
    studyLoading, quizLoading, streakLoading, summaryLoading, leaderboardLoading,
    studyError, quizError, streakError, summaryError, leaderboardError,
    timeRange
  ]);

  return {
    analytics: computeAnalytics(),
    isLoading: studyLoading || quizLoading || streakLoading || summaryLoading || leaderboardLoading,
    isError: studyError || quizError || streakError || summaryError || leaderboardError
  };
}