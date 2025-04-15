// hooks/api/useCards.ts
import useSWR from 'swr';
import { fetcher, fetchWithAuth } from './fetchWithAuth';

export function useCards(deckId?: string) {
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (deckId) queryParams.append('deck_id', deckId);
  
  const queryString = queryParams.toString();
  const url = `/api/cards${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false, // Don't refetch when window regains focus
    revalidateIfStale: true,  // Refetch if data is stale
    dedupingInterval: 60000,  // Deduplicate requests within 1 minute
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
    method: 'POST',
    body: JSON.stringify(cardData),
  });
}

// Add PUT functionality for updating an existing card
export async function updateCard(cardId: string, cardData: any) {
  return fetchWithAuth(`/api/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(cardData),
  });
}

// Add DELETE functionality
export async function deleteCard(cardId: string) {
  return fetchWithAuth(`/api/cards/${cardId}`, {
    method: 'DELETE',
  });
}

// Add bulk import functionality if needed
export async function importCards(deckId: string, cardsData: any[]) {
  return fetchWithAuth(`/api/decks/${deckId}/cards/import`, {
    method: 'POST',
    body: JSON.stringify(cardsData),
  });
}