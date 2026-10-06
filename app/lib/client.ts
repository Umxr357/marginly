export async function api<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "You're offline. Your writing is still here; reconnect and try again.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({
      error: "The service is temporarily unavailable. Please try again.",
    }));
  if (!response.ok)
    throw new Error(
      (data as { error?: string }).error ||
        "That didn't work. Please try again.",
    );
  return data as T;
}
