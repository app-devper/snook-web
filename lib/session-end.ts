import axios from "axios";
import { getToken, removeToken } from "./auth";

const BEARER_PREFIX = "Bearer ";

/**
 * A 401 ends the session only for the token that was sent and is still stored:
 * another tab may already have signed in again with a newer one.
 */
export function shouldEndSession(
  status: number | undefined,
  sentToken: string | null,
  storedToken: string | null,
): boolean {
  return status === 401 && sentToken !== null && sentToken === storedToken;
}

/** The token a request carried, read back from the Authorization header. */
export function sentTokenOf(config: { headers?: unknown } | undefined): string | null {
  const headers = config?.headers as { Authorization?: unknown } | undefined;
  const value = headers?.Authorization;
  if (typeof value !== "string" || !value.startsWith(BEARER_PREFIX)) return null;
  return value.slice(BEARER_PREFIX.length);
}

/** Response error handler for both API clients; always rejects with the original error. */
export function endSessionInterceptor(error: unknown): Promise<never> {
  const axiosError = axios.isAxiosError(error) ? error : undefined;
  if (shouldEndSession(axiosError?.response?.status, sentTokenOf(axiosError?.config), getToken())) {
    removeToken();
    if (typeof window !== "undefined") window.location.replace("/login");
  }
  return Promise.reject(error);
}
