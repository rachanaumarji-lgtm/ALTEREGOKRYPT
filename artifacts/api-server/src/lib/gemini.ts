const retryDelayMs = 1_000;

export async function fetchGeminiWithSingleRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const response = await fetch(url, init);
  if (response.status !== 503) return response;

  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  return fetch(url, init);
}