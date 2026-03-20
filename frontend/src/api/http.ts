const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export type ApiError = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

const csrfStorageKey = "csrfToken";
let csrfToken: string | null = null;

function loadCsrfTokenFromStorage() {
  if (csrfToken !== null) return;
  const saved = localStorage.getItem(csrfStorageKey);
  csrfToken = saved ? saved : null;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
  if (token) localStorage.setItem(csrfStorageKey, token);
  else localStorage.removeItem(csrfStorageKey);
}

function csrfHeaders(): Record<string, string> {
  loadCsrfTokenFromStorage();
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}

async function request<T>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!headers["Content-Type"] && options.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const method = options.method ?? (options.json !== undefined ? "POST" : "GET");

  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      ...headers,
      ...csrfHeaders(),
    },
    credentials: "include",
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T | ApiError) : ({} as T);

  if (!res.ok) {
    const apiErr = data as ApiError;
    const message = apiErr?.error?.message ?? `Request failed (${res.status})`;
    const err = new Error(message);
    (err as any).status = res.status;
    (err as any).details = apiErr?.error?.details;
    throw err;
  }

  return data as T;
}

export const api = {
  getCsrf: async () => {
    const data = await request<{ csrfToken: string }>("/api/auth/csrf", { method: "GET" });
    setCsrfToken(data.csrfToken);
    return data;
  },
  me: () => request<{ user: { id: number; username: string } }>("/api/auth/me", { method: "GET" }),
  login: (username: string, password: string) =>
    request<{ user: { id: number; username: string } }>("/api/auth/login", { method: "POST", json: { username, password } }),
  register: (username: string, password: string) =>
    request<{ user: { id: number; username: string } }>("/api/auth/register", { method: "POST", json: { username, password } }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  listExpenses: (params: Record<string, string | number | undefined>) =>
    request<{ items: Array<{ id: number; category: string; amount: number; date: string }>; page: number; limit: number; total: number }>(
      `/api/expenses?${new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => {
        if (v === undefined) return acc;
        acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>).toString())}`,
      { method: "GET" }
    ),

  createExpense: (payload: { category: string; amount: number; date: string }) =>
    request<{ expense: { id: number; category: string; amount: number; date: string } }>("/api/expenses", {
      method: "POST",
      json: payload,
    }),

  updateExpense: (id: number, payload: { category: string; amount: number; date: string }) =>
    request<{ expense: { id: number; category: string; amount: number; date: string } }>(`/api/expenses/${id}`, {
      method: "PUT",
      json: payload,
    }),

  deleteExpense: (id: number) => request<{ ok: true }>(`/api/expenses/${id}`, { method: "DELETE" }),

  dashboardSummary: (params?: Record<string, string>) =>
    request<{
      totalSpent: number;
      topCategory: string | null;
      recentTransactions: Array<{ id: number; category: string; amount: number; date: string }>;
    }>(`/api/analytics/dashboard/summary${params ? `?${new URLSearchParams(params).toString()}` : ""}`, { method: "GET" }),

  categoriesDistribution: (params?: Record<string, string>) =>
    request<{ categories: string[]; amounts: number[] }>(
      `/api/analytics/categories${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
      { method: "GET" }
    ),

  monthlyTrends: (params?: Record<string, string>) =>
    request<{ labels: string[]; amounts: number[] }>(
      `/api/analytics/monthly${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
      { method: "GET" }
    ),

  exportExpensesCsv: (params?: Record<string, string>) => {
    const url = `/api/expenses/export${params ? `?${new URLSearchParams(params).toString()}` : ""}`;
    return fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      credentials: "include",
      headers: csrfHeaders(),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      return res.blob();
    });
  },
};

export const apiBaseUrl = API_BASE_URL;

