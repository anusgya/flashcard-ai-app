export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const baseUrl = 'http://localhost:8000';
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error = new Error(
        errorData?.detail || `Error ${response.status}: ${response.statusText}`
      );
      
      (error as any).status = response.status;
      (error as any).info = errorData;
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        console.error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
    
    // Check if there's content to parse
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // If it's a 204 No Content response or empty body, return an empty object or appropriate value
    if (response.status === 204 || contentLength === '0') {
      return { success: true };
    }
    
    // Otherwise parse as JSON if the content type indicates JSON
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    // For other content types, you might want to handle differently
    return response.text();
  };
  
  export const fetcher = (url: string) => fetchWithAuth(url);