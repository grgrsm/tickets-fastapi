import type { Pricing, TicketType } from "@/types/api";

export function classifyAge(age: number, p: Pricing): { type: TicketType; price: number } {
  return age < p.child_age_limit
    ? { type: "child", price: p.child_ticket_price }
    : { type: "full", price: p.full_ticket_price };
}

export const ticketLabel: Record<TicketType, string> = { full: "Full ticket", child: "Child ticket" };

export function formatRub(amount: number): string {
  return `${amount.toLocaleString("en-US")} ₽`.replace(/\u00a0/g, " ");
}

export function pluralParticipants(n: number): string {
  return n === 1 ? "1 participant" : `${n} participants`;
}
