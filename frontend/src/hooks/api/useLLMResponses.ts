import useSWR from 'swr';
import { fetcher, fetchWithAuth } from './fetchWithAuth';
import { UUID } from 'crypto'; // Or another UUID type if you prefer

// Types for the LLM responses
export type ResponseType = 'mnemonic' | 'explanation' | 'example';

export interface LLMResponse {
  id: UUID;
  card_id: UUID;
  response_type: ResponseType;
  content: string;
  is_pinned: boolean;
  generated_at: string;
}

// Get all LLM responses for a card
export function useCardLLMResponses(cardId: string, responseType?: ResponseType) {
  const endpoint = responseType 
    ? `/api/interactions/cards/${cardId}/llm-responses?response_type=${responseType}`
    : `/api/interactions/cards/${cardId}/llm-responses`;
    
  const { data, error, isLoading, mutate } = useSWR(
    cardId ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
  
  return {
    responses: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Get card interactions
export function useCardInteractions(cardId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    cardId ? `/api/interactions/cards/${cardId}/interactions` : null,
    fetcher
  );
  
  return {
    interactions: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Generate a mnemonic for a card
export async function generateMnemonic(cardId: string, technique: string) {
  return fetchWithAuth(`/api/interactions/cards/${cardId}/mnemonics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      card_id: cardId,
      technique 
    }),
  });
}

// Generate an explanation for a card
export async function generateExplanation(cardId: string, detailLevel: string) {
  return fetchWithAuth(`/api/interactions/cards/${cardId}/eli5`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      card_id: cardId,
      detail_level: detailLevel 
    }),
  });
}

// Generate examples for a card
export async function generateExamples(cardId: string, count: number) {
  return fetchWithAuth(`/api/interactions/cards/${cardId}/examples`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      card_id: cardId,
      count 
    }),
  });
}

// Update an LLM response (pin/unpin)
export async function updateLLMResponse(responseId: string, isPinned: boolean) {
  return fetchWithAuth(`/api/interactions/llm-responses/${responseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_pinned: isPinned }),
  });
}

// Delete an LLM response
export async function deleteLLMResponse(responseId: string) {
  return fetchWithAuth(`/api/interactions/llm-responses/${responseId}`, {
    method: 'DELETE',
  });
}