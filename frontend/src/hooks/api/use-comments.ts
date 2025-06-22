import useSWR from "swr";
import { fetchWithAuth } from "./fetchWithAuth";

// Simplified user type for comment authors.
interface Author {
  id: string;
  username: string;
  avatar_url: string;
}

// Defines the structure of a comment, including nested replies.
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: Author;
  replies: Comment[];
  deck_id: string;
  user_id: string;
  parent_comment_id: string | null;
}

/**
 * Fetches all comments for a given public deck.
 * @param deckId The ID of the deck to fetch comments for.
 * @returns An object with the comments data, loading state, error state, and a mutate function.
 */
export function useComments(deckId: string | null) {
  const { data, error, mutate } = useSWR<Comment[]>(
    deckId ? `/api/decks/${deckId}/comments` : null,
    fetchWithAuth
  );

  return {
    comments: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

/**
 * Creates a new comment or a reply on a public deck.
 * @param deckId The ID of the deck where the comment will be posted.
 * @param content The text content of the comment.
 * @param parentCommentId Optional ID of the parent comment if this is a reply.
 * @returns The newly created comment.
 */
export async function createComment(
  deckId: string,
  content: string,
  parentCommentId?: string
) {
  const response = await fetchWithAuth(`/api/decks/${deckId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      content,
      parent_comment_id: parentCommentId,
      deck_id: deckId,
    }),
  });
  return response;
}

/**
 * Updates an existing comment.
 * @param commentId The ID of the comment to update.
 * @param content The new content for the comment.
 * @returns The updated comment.
 */
export async function updateComment(commentId: string, content: string) {
  const response = await fetchWithAuth(`/api/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
  return response;
}

/**
 * Deletes a comment.
 * @param commentId The ID of the comment to delete.
 */
export async function deleteComment(commentId: string) {
  await fetchWithAuth(`/api/comments/${commentId}`, {
    method: "DELETE",
  });
}
