// types/analytics.ts
"use client"

export interface StudySession {
    id: string;
    user_id: string;
    deck_id: string;
    start_time: string;
    end_time: string | null;
    cards_studied: number;
    accuracy: number;
    points_earned: number;
    records?: StudyRecord[];
  }
  
  export interface StudyRecord {
    id: string;
    session_id: string;
    card_id: string;
    response_quality: string;
    time_taken: number;
    studied_at: string;
    next_review: string | null;
    confidence_level: string | null;
    points_earned: number;
  }
  
  export interface QuizSession {
    id: string;
    user_id: string;
    deck_id: string;
    start_time: string;
    end_time: string | null;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    time_taken: number;
    points_earned: number;
    answers?: QuizAnswer[];
  }
  
  export interface QuizQuestion {
    id: string;
    card_id: string;
    question_text: string;
    correct_answer: string;
    options: string[];
    difficulty: string;
    generated_at: string;
  }
  
  export interface QuizAnswer {
    id: string;
    session_id: string;
    question_id: string;
    user_answer: string;
    is_correct: boolean;
    time_taken: number;
    points_earned: number;
  }
  
  export interface DailyStreak {
    id: string;
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_study_date: string | null;
    total_study_days: number;
    points_earned: number;
  }
  
  export interface LeaderboardEntry {
    id: string;
    user_id: string;
    total_points: number;
    quiz_points: number;
    study_points: number;
    achievement_points: number;
    streak_points: number;
    rank: number | null;
    timeframe: string;
    calculated_at: string;
    username?: string;
  }
  
  export interface LeaderboardResponse {
    timeframe: string;
    entries: LeaderboardEntry[];
    user_rank: number | null;
  }
  
  export interface UserGamificationSummary {
    total_points: number;
    current_streak: number;
    longest_streak: number;
    achievement_count: number;
    rank: number | null;
    study_points?: number;
    quiz_points?: number;
    streak_points?: number;
  }
  
  export interface StudySessionStats {
    total_sessions: number;
    total_cards_studied: number;
    average_accuracy: number;
    total_points: number;
    average_time_per_card: number;
    mastery_rate: number;
  }
  
  export interface QuizSessionStats {
    total_sessions: number;
    average_accuracy: number;
    total_points: number;
    best_score: number;
    average_time: number;
    completion_rate: number;
  }
  
  // Dashboard specific types
  
  export interface StudyTrendDataPoint {
    interval: string;
    accuracy: number;
    timeSpent: number;
    cardsStudied: number;
  }
  
  export interface ResponseQualityDataPoint {
    name: string;
    value: number;
    color: string;
  }
  
  export interface StreakDataPoint {
    day: string;
    date: string;
    value: number;
  }
  
  export interface QuizVsStudyDataPoint {
    date: string;
    studyAccuracy: number | null;
    quizAccuracy: number | null;
  }
  
  export interface DifficultCardDataPoint {
    card: string;
    accuracy: number;
    timeSpent: number;
  }
  
  export interface PointsDataPoint {
    name: string;
    value: number;
    color: string;
  }
  
  export interface SessionFrequency {
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
  
  export interface OptimalStudyPatterns {
    bestTime: string;
    idealLength: string;
    reviewInterval: string;
    cardsPerSession: string;
  }
  
  export interface RankingData {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
    totalUsers: number;
  }
  
  export interface AnalyticsDashboardData {
    learningEffectivenessScore: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyTime: number;
    averageSessionDuration: number;
    rank: number;
    totalUsers: number;
    studyTrendData: StudyTrendDataPoint[];
    responseQualityData: ResponseQualityDataPoint[];
    streakData: StreakDataPoint[];
    quizVsStudyData: QuizVsStudyDataPoint[];
    difficultCardsData: DifficultCardDataPoint[];
    pointsData: PointsDataPoint[];
    rankingData: RankingData;
    sessionFrequency: SessionFrequency;
    optimalStudyPatterns: OptimalStudyPatterns;
  }