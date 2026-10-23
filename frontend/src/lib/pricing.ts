import type { Pricing, TicketType } from "@/types/api";

export function classifyAge(age: number, p: Pricing): { type: TicketType; price: number } {
  return age < p.child_age_limit
    ? { type: "child", price: p.child_ticket_price }
    : { type: "full", price: p.full_ticket_price };
}

export const ticketLabel: Record<TicketType, string> = { full: "Полный билет", child: "Детский билет" };

export function formatRub(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`.replace(/\u00a0/g, " ");
}

export function pluralParticipants(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} участник`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} участника`;
  return `${n} участников`;
}
