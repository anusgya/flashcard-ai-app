// hooks/api/useCards.ts
import useSWR from "swr";
import { fetcher, fetchWithAuth } from "./fetchWithAuth";

export function useCards(deckId?: string) {
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (deckId) queryParams.append("deck_id", deckId);

  const queryString = queryParams.toString();
  const url = `/api/cards${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false, // Don't refetch when window regains focus
    revalidateIfStale: true, // Refetch if data is stale
    dedupingInterval: 60000, // Deduplicate requests within 1 minute
  });

  return {
    cards: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCard(cardId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    cardId ? `/api/cards/${cardId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000,
    }
  );

  return {
    card: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Add POST functionality for creating a new card
export async function createCard(cardData: any) {
  return fetchWithAuth(`/api/cards`, {
    method: "POST",
    body: JSON.stringify(cardData),
  });
}

export async function generateCards(generationRequest: {
  deck_id: string;
  source_text: string;
  source_type: string;
  num_flashcards: number;
  topic?: string;
}) {
  return fetchWithAuth(`/api/cards/generate`, {
    method: "POST",
    body: JSON.stringify(generationRequest),
  });
}

// Add PUT functionality for updating an existing card
export async function updateCard(cardId: string, cardData: any) {
  return fetchWithAuth(`/api/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(cardData),
  });
}

// Add DELETE functionality
export async function deleteCard(cardId: string) {
  return fetchWithAuth(`/api/cards/${cardId}`, {
    method: "DELETE",
  });
}

// Add bulk import functionality if needed
export async function importCards(deckId: string, cardsData: any[]) {
  return fetchWithAuth(`/api/decks/${deckId}/cards/import`, {
    method: "POST",
    body: JSON.stringify(cardsData),
  });
}

export async function addCardMedia(
  cardId: string,
  mediaFile: File,
  side: "front" | "back"
) {
  const formData = new FormData();
  formData.append("media_file", mediaFile);
  formData.append("side", side);

  return fetchWithAuth(`/api/cards/${cardId}/media`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header when using FormData, browser will set it with boundary
  });
}

// Delete media from a card
export async function deleteCardMedia(cardId: string, mediaId: string) {
  return fetchWithAuth(`/api/cards/${cardId}/media/${mediaId}`, {
    method: "DELETE",
  });
}
