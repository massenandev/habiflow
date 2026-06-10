import { Habit, HabitFormValues } from "../domain/types";
import { addDays, isoToday } from "../application/date-range";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export class HabitApiClient {
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

  async toggleHabit(habitId: string, deviceId: string): Promise<Habit> {
    return this.request<Habit>(`/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ deviceId })
    });
  }

  async history(habitId: string, deviceId: string, from: string, to: string) {
    return this.request(`/habits/${habitId}/history?deviceId=${encodeURIComponent(deviceId)}&from=${from}&to=${to}`);
  }

  async health(): Promise<boolean> {
    try {
      await this.request("/health");
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(payload?.message ?? "Something went wrong.", response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }
}
