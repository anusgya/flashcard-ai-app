import useSWR from "swr";
import { fetcher, fetchWithAuth } from "./fetchWithAuth"; // Assuming fetchWithAuth handles token injection
import {
  TimeRange,
  ResponseQuality,
  ConfidenceLevel,
  CardState,
} from "@/enums"; // Adjust path as needed
import { UUID } from "crypto"; // Or use 'string' if UUIDs are treated as strings

// --- Backend Schema Interfaces ---

interface StudySession {
  id: UUID;
  deck_id: UUID;
  user_id: UUID;
  start_time: string; // ISO 8601 date string
  end_time?: string | null; // ISO 8601 date string
  cards_studied: number;
  accuracy: number;
  points_earned: number;
  created_at: string; // ISO 8601 date string
}

interface StudySessionCreate {
  deck_id: UUID;
}

interface StudySessionUpdate {
  end_time?: string | null;
  cards_studied?: number;
  accuracy?: number;
  points_earned?: number;
}

// Input type for creating a record
interface StudyRecordCreate {
  response_quality: ResponseQuality;
  time_taken: number; // In seconds
  confidence_level?: ConfidenceLevel | null;
  session_id: UUID;
  card_id: UUID;
}

// Response type after creating a record (matches backend schemas.StudyRecordResponse)
interface StudyRecordResponse extends StudyRecordCreate {
  id: UUID;
  studied_at: string; // ISO 8601 date string
  next_review?: string | null; // ISO 8601 date string
  points_earned: number;
  ease_factor: number;
  interval: number; // In days (or relevant unit from backend)
  repetition_number: number;
}

// Used for the new preview endpoint
type IntervalPreviews = Record<"again" | "hard" | "good" | "perfect", string>;

// Updated to match backend schema
interface DueCardsResponse {
  due_now: number;
  new_cards: number;
  learning_cards: number;
  review_cards: number;
}

interface SpacedRepetitionProgress {
  total_cards: number;
  interval_distribution: {
    new: number;
    learning: number;
    review_1_7: number;
    review_8_30: number;
    review_31_90: number;
    review_91_plus: number;
  };
  state_distribution: {
    new: number;
    learning: number;
    review: number;
  };
  average_ease_factor: number;
}

// Updated NextCardResponse to include all fields from the backend
interface NextCardResponse {
  card_id: UUID;
  due_date?: string | null; // ISO 8601 date string
  current_streak?: number | null;
  total_reviews?: number | null;
  card_state: string; // CardState enum as string
  is_due: boolean; // Added to match backend
}

interface StudySessionStats {
  total_sessions: number;
  total_cards_studied: number;
  average_accuracy: number;
  total_points: number;
  average_time_per_card: number;
  mastery_rate: number;
}

// --- SWR Hooks and API Functions ---

// Get study sessions list
export function useStudySessions(timeRange: TimeRange, deckId?: UUID | null) {
  const queryParams = new URLSearchParams();
  queryParams.append("time_range", timeRange);
  if (deckId) queryParams.append("deck_id", deckId as string); // Cast UUID to string if needed

  const url =
    deckId !== undefined
      ? `/api/study/sessions?${queryParams.toString()}`
      : null; // Conditionally fetch

  const { data, error, isLoading, mutate } = useSWR<StudySession[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    sessions: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get a specific study session
export function useStudySession(sessionId: UUID | null) {
  const url = sessionId ? `/api/study/sessions/${sessionId}` : null;

  const { data, error, isLoading, mutate } = useSWR<StudySession>(
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

// Create a new study session
export async function createStudySession(
  sessionData: StudySessionCreate,
  options: RequestInit = {}
): Promise<StudySession> {
  return fetchWithAuth(`/api/study/sessions`, {
    method: "POST",
    body: JSON.stringify(sessionData),
    ...options,
  });
}

// Update an existing study session (e.g., to set end_time)
export async function updateStudySession(
  sessionId: UUID,
  sessionData: Partial<StudySessionUpdate> // Use Partial for flexibility
): Promise<StudySession> {
  return fetchWithAuth(`/api/study/sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(sessionData),
  });
}

// Create a study record after reviewing a card
export async function createStudyRecord(
  recordData: StudyRecordCreate
): Promise<StudyRecordResponse> {
  return fetchWithAuth(`/api/study/records`, {
    method: "POST",
    body: JSON.stringify(recordData),
  });
}

// Get due cards count - updated to match the backend response schema
export function useDueCards(deckId: UUID | null) {
  const url = deckId ? `/api/study/due/${deckId}` : null;

  const { data, error, isLoading, mutate } = useSWR<DueCardsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate on focus might be useful here
      revalidateIfStale: true,
      dedupingInterval: 30000, // Check more frequently for due cards (30 seconds)
    }
  );

  return {
    dueCards: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get spaced repetition progress stats for a deck - updated to include state_distribution
export function useSpacedRepetitionProgress(deckId: UUID | null) {
  const url = deckId ? `/api/study/progress/${deckId}` : null;

  const { data, error, isLoading, mutate } = useSWR<SpacedRepetitionProgress>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    progress: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Get the next card to study in a deck - updated to match the backend response schema
export function useNextCard(deckId: UUID | null) {
  // Define error type for proper handling
  interface ErrorWithResponse extends Error {
    response?: {
      status: number;
      data?: any;
    };
    status?: number;
  }

  const url = deckId ? `/api/study/next/${deckId}` : null;

  // Create custom fetcher function that handles 404s
  const customFetcher = async (url: string) => {
    try {
      return await fetcher(url);
    } catch (error) {
      const typedError = error as ErrorWithResponse;

      // If we get a 404 (no cards available), return null instead of throwing
      if (typedError.response?.status === 404 || typedError.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR<NextCardResponse>(
    url,
    customFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: false, // Don't retry on error
      errorRetryCount: 0, // No retries for 404s
      dedupingInterval: 2000,
    }
  );

  // Function to manually trigger a refetch
  const fetchNext = async () => {
    if (deckId) {
      // Clear cache before mutating to ensure we don't get stale data
      // The key part: this forces SWR to make a fresh request instead of using the cache
      await mutate(undefined, {
        revalidate: true,
        populateCache: true,
        rollbackOnError: false,
      });
    }
    return data;
  };

  return {
    nextCard: data,
    isLoading,
    isError: !!error && (error as ErrorWithResponse).response?.status !== 404,
    error: error as ErrorWithResponse | null,
    mutate: fetchNext,
  };
}

// New function to fetch interval previews
export async function getIntervalPreviews(
  cardId: UUID
): Promise<IntervalPreviews> {
  return fetchWithAuth(`/api/study/preview-intervals/${cardId}`);
}

// Get overall study statistics for a deck
export function useStudyStats(deckId: UUID | null) {
  const url = deckId ? `/api/study/stats/${deckId}` : null;

  const { data, error, isLoading, mutate } = useSWR<StudySessionStats>(
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

// Function to update card states across the system
export async function updateCardStates(
  deckId?: UUID
): Promise<{ success: boolean; message: string }> {
  const url = deckId
    ? `/api/study/update-card-states?deck_id=${deckId}`
    : "/api/study/update-card-states";

  return fetchWithAuth(url, {
    method: "POST",
  });
}
