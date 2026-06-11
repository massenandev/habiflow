import { AuthSession, Habit, HabitCompletion, HabitFormValues } from "../domain/types";
import { addDays, isoToday } from "../application/date-range";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export class HabitApiClient {
  private session: AuthSession | null = null;
  private onSessionChange?: (session: AuthSession | null) => void;

  setSession(session: AuthSession | null, onSessionChange?: (session: AuthSession | null) => void): void {
    this.session = session;
    this.onSessionChange = onSessionChange;
  }

  async signup(email: string, password: string, displayName?: string): Promise<AuthSession> {
    return this.request<AuthSession>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, displayName }) }, { skipAuth: true });
  }

  async login(email: string, password: string): Promise<AuthSession> {
    return this.request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, { skipAuth: true });
  }

  async social(provider: "google" | "apple", idToken: string): Promise<AuthSession> {
    return this.request<AuthSession>("/auth/social", { method: "POST", body: JSON.stringify({ provider, idToken }) }, { skipAuth: true });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, { skipAuth: true });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, { skipAuth: true });
  }

  async me(): Promise<AuthSession["user"]> {
    return this.request<AuthSession["user"]>("/auth/me");
  }

  async deleteAccount(): Promise<void> {
    await this.request("/auth/me", { method: "DELETE" });
  }

  async claimGuestData(deviceId: string): Promise<{ claimed: number }> {
    return this.request<{ claimed: number }>("/auth/claim-guest-data", { method: "POST", body: JSON.stringify({ deviceId }) });
  }

  async listHabits(deviceId: string, days: number): Promise<Habit[]> {
    const to = isoToday();
    const from = addDays(to, -days + 1);
    return this.request<Habit[]>(`/habits?deviceId=${encodeURIComponent(deviceId)}&from=${from}&to=${to}`);
  }

  async createHabit(deviceId: string, values: HabitFormValues): Promise<Habit> {
    return this.request<Habit>("/habits", {
      method: "POST",
      body: JSON.stringify({ deviceId, ...values })
    });
  }

  async updateHabit(habitId: string, deviceId: string, values: HabitFormValues): Promise<Habit> {
    return this.request<Habit>(`/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify({ deviceId, ...values })
    });
  }

  async archiveHabit(habitId: string, deviceId: string): Promise<Habit> {
    return this.request<Habit>(`/habits/${habitId}/archive`, {
      method: "POST",
      body: JSON.stringify({ deviceId })
    });
  }

  async deleteHabit(habitId: string, deviceId: string): Promise<void> {
    await this.request<void>(`/habits/${habitId}`, {
      method: "DELETE",
      body: JSON.stringify({ deviceId })
    });
  }

  async toggleHabit(habitId: string, deviceId: string, date: string): Promise<Habit> {
    return this.request<Habit>(`/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ deviceId, date })
    });
  }

  async history(habitId: string, deviceId: string, from: string, to: string): Promise<HabitCompletion[]> {
    return this.request<HabitCompletion[]>(`/habits/${habitId}/history?deviceId=${encodeURIComponent(deviceId)}&from=${from}&to=${to}`);
  }

  async health(): Promise<boolean> {
    try {
      await this.request("/health");
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, init: RequestInit = {}, options: { skipAuth?: boolean; retry?: boolean } = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(!options.skipAuth && this.session ? { Authorization: `Bearer ${this.session.accessToken}` } : {}),
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      if (response.status === 401 && this.session && !options.skipAuth && options.retry !== false) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return this.request<T>(path, init, { ...options, retry: false });
        }
      }
      const payload = await response.json().catch(() => null);
      throw new ApiError(payload?.message ?? "Something went wrong.", response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  private async refreshSession(): Promise<boolean> {
    if (!this.session) {
      return false;
    }
    try {
      const next = await this.request<AuthSession>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: this.session.refreshToken }) }, { skipAuth: true, retry: false });
      this.session = next;
      this.onSessionChange?.(next);
      return true;
    } catch {
      this.session = null;
      this.onSessionChange?.(null);
      return false;
    }
  }
}
