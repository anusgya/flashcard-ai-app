import useSWR from "swr";
import { fetcher, fetchWithAuth } from "./fetchWithAuth";

// Get all decks for the current user
export function useDecks() {
  const { data, error, isLoading, mutate } = useSWR("/api/decks", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 60000,
  });

  return {
    decks: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRecentDecks() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/study/recent",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    recentDecks: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Get a specific deck by ID
export function useDeck(deckId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    deckId ? `/api/decks/${deckId}` : null,
    fetcher
  );

  return {
    deck: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePublicDecks() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/decks/public",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000,
    }
  );

  return {
    publicDecks: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Create a new deck
export async function createDeck(deckData: {
  name: string;
  description: string;
  source_type: string;
}) {
  return fetchWithAuth("/api/decks/", {
    method: "POST",
    body: JSON.stringify(deckData),
  });
}

// Update an existing deck
export async function updateDeck(
  deckId: string,
  deckData: {
    name?: string;
    description?: string;
    source_type?: string;
    is_public?: boolean;
  }
) {
  return fetchWithAuth(`/api/decks/${deckId}`, {
    method: "PUT",
    body: JSON.stringify(deckData),
  });
}

// Delete a deck
export async function deleteDeck(deckId: string) {
  return fetchWithAuth(`/api/decks/${deckId}`, {
    method: "DELETE",
  });
}

// Clone a deck
export async function cloneDeck(deckId: string) {
  return fetchWithAuth(`/api/decks/${deckId}/clone`, {
    method: "POST",
  });
}

// Import cards from CSV
export async function importCardsFromCSV(deckId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("Attempting to import to deck ID:", deckId);

  return fetchWithAuth(`/api/decks/${deckId}/import/csv`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header when using FormData, browser will set it with boundary
  });
}

// Import cards from text file
export async function importCardsFromText(deckId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("Attempting to import text file to deck ID:", deckId);

  return fetchWithAuth(`/api/decks/${deckId}/import/text`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header when using FormData, browser will set it with boundary
  });
}
