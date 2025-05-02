// hooks/api/uploadFileFetch.ts
import { fetchWithAuth } from './fetchWithAuth';

/**
 * Uploads a file using the fetchWithAuth utility
 *
 * @param file - The file to upload
 * @returns Promise that resolves with the response from the server
 */
export async function uploadFileFetch(file: File) {
  const formData = new FormData();

  // This name MUST match the parameter name in the FastAPI endpoint
  formData.append('file', file);

  // Make the API call using fetchWithAuth
  // DO NOT manually set the Content-Type header when sending FormData.
  // The browser will automatically set it to 'multipart/form-data'
  // with the correct boundary.
  return fetchWithAuth('/api/uploads/', {
    method: 'POST',
    body: formData,
    // No 'headers' option needed here for Content-Type
  });
}
