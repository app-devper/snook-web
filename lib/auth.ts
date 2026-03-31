const TOKEN_KEY = "snook_token";
const SNOOK_HOST_KEY = "snook_api_host";
const COOKIE_NAME = "snook_auth";
const ROLE_KEY = "snook_role";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24}`;
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SNOOK_HOST_KEY);
  localStorage.removeItem(ROLE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function getSnookApiHost(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SNOOK_HOST_KEY);
}

export function setSnookApiHost(host: string) {
  localStorage.setItem(SNOOK_HOST_KEY, host);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUserRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function setUserRole(role: string) {
  localStorage.setItem(ROLE_KEY, role);
}
