import type { ApiErrorBody, Booking, EventInfo } from "@/types/api";

const publicBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const base = typeof window === "undefined" ? (process.env.API_INTERNAL_URL ?? publicBase) : publicBase;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}/api/v1${path}`, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "network", "Нет связи с сервером. Проверьте подключение и попробуйте снова.");
  }
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      
    }
    throw new ApiError(
      res.status,
      body?.error.code ?? "unknown",
      body?.error.message ?? "Не удалось выполнить запрос. Попробуйте позже.",
      body?.error.details,
    );
  }
  return (await res.json()) as T;
}

export const getEvents = () => request<EventInfo[]>("/events");
export const getEvent = (id: number) => request<EventInfo>(`/events/${id}`);

export const createBooking = (payload: {
  event_id: number;
  contact_email: string;
  participants: { name: string; age: number }[];
}) =>
  request<Booking>("/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
