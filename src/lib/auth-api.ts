import { API_BASE_URL } from "./api-config";

export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthResponse = {
  message: string;
  user: AuthUser;
  accessToken?: string;
};

type RefreshResponse = {
  message: string;
  accessToken: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken?: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  mobileNumber?: string;
  dateOfBirth?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

type ErrorResponse = {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string }>;
};

const authStorageKey = "sunjet.auth";
export const authSessionChangedEvent = "sunjet.auth-changed";
let refreshAccessTokenPromise: Promise<string> | null = null;

async function parseJsonResponse<T>(response: Response) {
  const data = (await response.json().catch(() => ({}))) as T & ErrorResponse;

  if (!response.ok) {
    const validationMessage = data.errors?.find((item) => item.message)?.message;
    throw new Error(
      validationMessage ?? data.message ?? data.error ?? "Authentication request failed",
    );
  }

  return data as T;
}

async function requestAuth(path: string, body: RegisterPayload | LoginPayload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseJsonResponse<AuthResponse>(response);
}

export function registerUser(payload: RegisterPayload) {
  return requestAuth("/auth/register", payload);
}

export function loginUser(payload: LoginPayload) {
  return requestAuth("/auth/login", payload);
}

export async function logoutUser() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function refreshAccessToken() {
  refreshAccessTokenPromise ??= (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    const result = await parseJsonResponse<RefreshResponse>(response);
    const session = getStoredAuthSession();

    if (session) {
      persistAuthSession({
        message: result.message,
        user: session.user,
        accessToken: result.accessToken,
      });
    }

    return result.accessToken;
  })().finally(() => {
    refreshAccessTokenPromise = null;
  });

  return refreshAccessTokenPromise;
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  });
  const result = await parseJsonResponse<{ message: string; user: AuthUser }>(response);

  return result.user;
}

export async function restoreAuthSession() {
  try {
    const user = await getCurrentUser();
    const session = getStoredAuthSession();

    persistAuthSession({
      message: "Session restored",
      user,
      accessToken: session?.accessToken,
    });

    return getStoredAuthSession();
  } catch {
    try {
      const accessToken = await refreshAccessToken();
      const user = await getCurrentUser();

      persistAuthSession({
        message: "Session refreshed",
        user,
        accessToken,
      });

      return getStoredAuthSession();
    } catch {
      clearAuthSession();
      return null;
    }
  }
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const request = () => {
    const headers = new Headers(init.headers);
    const accessToken = getStoredAuthSession()?.accessToken;

    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(`${API_BASE_URL}${input}`, {
      ...init,
      credentials: "include",
      headers,
    });
  };

  let response = await request();

  if (response.status === 401) {
    try {
      await refreshAccessToken();
      response = await request();
    } catch {
      clearAuthSession();
    }
  }

  return response;
}

export function persistAuthSession(result: AuthResponse) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    authStorageKey,
    JSON.stringify({
      user: result.user,
      accessToken: result.accessToken,
    }),
  );
  window.dispatchEvent(new Event(authSessionChangedEvent));
}

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(authStorageKey);
  window.dispatchEvent(new Event(authSessionChangedEvent));
}
