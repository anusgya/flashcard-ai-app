/**
 * Performs a fetch request, automatically adding the Authorization header
 * if a token exists in localStorage. Handles JSON parsing and error formatting.
 * Conditionally sets Content-Type, avoiding it for FormData.
 *
 * @param url - The URL path (relative to the base URL)
 * @param options - Standard RequestInit options for fetch
 * @returns Promise resolving with the parsed response data
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Retrieve the authentication token from local storage
  const token = localStorage.getItem('token');
  // Define the base URL for the API
  const baseUrl = 'http://localhost:8000'; // Or your actual API base URL

  // Initialize headers object
  const baseHeaders: HeadersInit = {};

  // Conditionally add Content-Type header
  // DO NOT add Content-Type if the body is FormData, as the browser
  // needs to set it automatically with the correct boundary.
  if (!(options.body instanceof FormData)) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token exists
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Merge base headers with any custom headers provided in options
  const headers = {
    ...baseHeaders,
    ...options.headers, // Allows overriding default headers if needed
  };

  try {
    // Perform the fetch request
    const response = await fetch(`${baseUrl}${url}`, {
      ...options, // Spread the original options (method, body, etc.)
      headers, // Use the merged headers
      credentials: 'include', // Include cookies in requests
    });

    // --- Response Handling ---

    // Check if the response indicates an error
    if (!response.ok) {
      let errorData = null;
      try {
        // Attempt to parse error details from the response body as JSON
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, ignore (errorData remains null)
        console.warn("Could not parse error response as JSON", e);
      }

      // Create a new Error object with details
      const error = new Error(
        // Use detailed message from server if available, otherwise use status text
        (errorData as any)?.detail || `Error ${response.status}: ${response.statusText}`
      );

      // Attach status code and full error info to the error object
      (error as any).status = response.status;
      (error as any).info = errorData;

      // Log a specific message for authentication failures
      if (response.status === 401) {
        console.error('Authentication failed (401). Token might be invalid or expired. Please log in again.');
        // Optionally: trigger a logout or redirect to login page here
        // window.location.href = '/login';
      }

      // Throw the error to be caught by the calling code
      throw error;
    }

    // --- Successful Response Handling ---

    // Get content type and length to decide how to parse the body
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // Handle 204 No Content or responses with zero content length
    if (response.status === 204 || contentLength === '0') {
      // Return a simple success indicator or null/undefined as appropriate
      return { success: true, status: response.status };
    }

    // Parse as JSON if the content type indicates JSON
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // For other content types (like text/plain), return as text
    // You might add more handlers here (e.g., for blobs) if needed
    console.warn(`Response received with Content-Type: ${contentType}. Parsing as text.`);
    return response.text();

  } catch (error) {
    // Catch fetch errors (network issues, etc.) or errors thrown above
    console.error('Fetch error:', error);
    // Re-throw the error so the calling component knows something went wrong
    throw error;
  }
};

/**
 * A simplified fetcher function compatible with SWR or similar libraries.
 * @param url - The URL path to fetch.
 * @returns Promise resolving with the parsed response data.
 */
export const fetcher = (url: string) => fetchWithAuth(url);

