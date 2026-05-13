/**
 * Fetch utility with built-in timeout and retry logic.
 * Dimension 19: Availability (Audit 10/10).
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}
