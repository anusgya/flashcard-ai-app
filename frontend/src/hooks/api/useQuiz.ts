import useSWR from 'swr';
import { fetcher, fetchWithAuth } from './fetchWithAuth'; // Assuming fetchWithAuth handles token injection
import { TimeRange, QuizDifficulty } from '@/enums'; // Adjust path as needed
import { UUID } from 'crypto'; // Or use 'string' if UUIDs are treated as strings

// --- Backend Schema Interfaces ---

export interface QuizSession {
  id: UUID;
  deck_id: UUID;
  user_id: UUID;
  start_time: string; // ISO 8601 date string
  end_time?: string | null; // ISO 8601 date string
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  points_earned: number;
  time_taken?: number | null; // In seconds
  created_at: string; // ISO 8601 date string
}

export interface QuizSessionCreate {
  deck_id: UUID;
}

export interface QuizSessionUpdate {
  end_time?: string | null;
  correct_answers?: number;
  accuracy?: number;
  points_earned?: number;
  time_taken?: number;
  total_questions?: number; // Add this line
}

export interface QuizQuestionCreate {
  card_id: UUID;
  question_text?: string;
  correct_answer?: string;
  options?: string[];
  difficulty: QuizDifficulty;
}

export interface QuizQuestionResponse {
  id: UUID;
  card_id: UUID;
  question_text: string;
  correct_answer: string;
  options: string[];
  difficulty: string;
  generated_at: string; // ISO 8601 date string
}

export interface QuizAnswerCreate {
  session_id: UUID;
  question_id: UUID;
  user_answer: string;
  time_taken: number; // In seconds
}

export interface QuizAnswerResponse extends QuizAnswerCreate {
  id: UUID;
  is_correct: boolean;
  points_earned: number;
  created_at: string; // ISO 8601 date string
}

export interface QuizSessionStats {
  total_sessions: number;
  average_accuracy: number;
  total_points: number;
  best_score: number;
  average_time: number;
  completion_rate: number;
}

export interface StartQuizResponse {
  session: QuizSession;
  questions: QuizQuestionResponse[];
}

// --- SWR Hooks and API Functions ---

// Get quiz sessions list
export function useQuizSessions(timeRange: TimeRange, deckId?: UUID | null) {
  const queryParams = new URLSearchParams();
  queryParams.append('time_range', timeRange);
  if (deckId) queryParams.append('deck_id', deckId as string);

  const url = `/api/quiz/sessions?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<QuizSession[]>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    sessions: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get a specific quiz session
export function useQuizSession(sessionId: UUID | null) {
  const url = sessionId ? `/api/quiz/sessions/${sessionId}` : null;

  const { data, error, isLoading, mutate } = useSWR<QuizSession>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    session: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Create a new quiz session
export async function createQuizSession(sessionData: QuizSessionCreate): Promise<QuizSession> {
  return fetchWithAuth(`/api/quiz/sessions`, {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
}

// Update an existing quiz session
export async function updateQuizSession(
  sessionId: UUID,
  sessionData: Partial<QuizSessionUpdate>
): Promise<QuizSession> {
  return fetchWithAuth(`/api/quiz/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
}

// Submit a quiz answer
export async function submitQuizAnswer(answerData: QuizAnswerCreate): Promise<QuizAnswerResponse> {
  return fetchWithAuth(`/api/quiz/answers`, {
    method: 'POST',
    body: JSON.stringify(answerData),
  });
}

// Get quiz statistics for a deck
export function useQuizStats(deckId: UUID | null) {
  const url = deckId ? `/api/quiz/stats/${deckId}` : null;

  const { data, error, isLoading, mutate } = useSWR<QuizSessionStats>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get a question for a specific card
export function useCardQuestion(cardId: UUID | null, difficulty: QuizDifficulty = QuizDifficulty.MEDIUM, regenerate: boolean = false) {
  let url = null;
  
  if (cardId) {
    const queryParams = new URLSearchParams();
    queryParams.append('difficulty', difficulty);
    queryParams.append('regenerate', regenerate.toString());
    url = `/api/quiz/questions/${cardId}?${queryParams.toString()}`;
  }

  const { data, error, isLoading, mutate } = useSWR<QuizQuestionResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    question: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get all questions for a quiz session
export function useSessionQuestions(sessionId: UUID | null) {
  const url = sessionId ? `/api/quiz/session/${sessionId}/questions` : null;

  const { data, error, isLoading, mutate } = useSWR<QuizQuestionResponse[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    questions: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Start a new quiz with generated questions
export async function startQuiz(
  deckId: UUID, 
  difficulty: QuizDifficulty = QuizDifficulty.MEDIUM, 
  numQuestions?: number
): Promise<StartQuizResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('deck_id', deckId as string);
  queryParams.append('difficulty', difficulty);
  if (numQuestions) queryParams.append('num_questions', numQuestions.toString());

  return fetchWithAuth(`/api/quiz/start?${queryParams.toString()}`, {
    method: 'POST',
  });
}

// Generate quiz questions for a deck
export async function generateQuizQuestions(
  deckId: UUID,
  difficulty: QuizDifficulty = QuizDifficulty.MEDIUM,
  numQuestions?: number,
  regenerate: boolean = false
): Promise<QuizQuestionResponse[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('deck_id', deckId as string);
  queryParams.append('difficulty', difficulty);
  if (numQuestions) queryParams.append('num_questions', numQuestions.toString());
  queryParams.append('regenerate', regenerate.toString());

  return fetchWithAuth(`/api/quiz/generate?${queryParams.toString()}`, {
    method: 'POST',
  });
}

// Create a quiz question
export async function createQuizQuestion(questionData: QuizQuestionCreate): Promise<QuizQuestionResponse> {
  return fetchWithAuth(`/api/quiz/questions`, {
    method: 'POST',
    body: JSON.stringify(questionData),
  });
}

// Get random quiz questions from a deck
export function useRandomQuestions(
  deckId: UUID | null, 
  count: number = 10, 
  difficulty: QuizDifficulty = QuizDifficulty.MEDIUM
) {
  let url = null;
  
  if (deckId) {
    const queryParams = new URLSearchParams();
    queryParams.append('count', count.toString());
    queryParams.append('difficulty', difficulty);
    url = `/api/quiz/random/${deckId}?${queryParams.toString()}`;
  }

  const { data, error, isLoading, mutate } = useSWR<QuizQuestionResponse[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    questions: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}