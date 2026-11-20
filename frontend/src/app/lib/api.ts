"use client";

const TOKEN_KEY = "parma_resell_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("parma-auth-changed"));
}

export function logout(): void {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("parma-auth-changed"));
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? {"Content-Type": "application/json"} : {}),
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errors: Record<string, string> = {
      invalid_credentials: "Неверный номер телефона или пароль",
      identity_already_registered: "Этот телефон или email уже зарегистрирован",
      authentication_required: "Необходимо войти в аккаунт",
      invalid_or_expired_token: "Сессия истекла. Войдите снова",
    };
    throw new Error(errors[body.error] || body.error || "Ошибка сервера");
  }
  return body as T;
}

export function apiPost<T>(path: string, data: unknown): Promise<T> {
  return apiRequest<T>(path, {method: "POST", body: JSON.stringify(data)});
}

export type ApiUser = {id: string; phone: string; email: string | null; role: string; club_id: string | null};
export type ApiTicket = {id: string; provider_ticket_id: string; season: string; verification_status: string; seat_id: string; club_id: string};
export type ApiOrder = {id: string; status: string; amount_kopecks: number; opponent: string; starts_at: string; match_id: string; listing_id: string};
