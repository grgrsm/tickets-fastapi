export type Pricing = {
  full_ticket_price: number;
  child_ticket_price: number;
  child_age_limit: number;
  adult_age: number;
  max_participants: number;
  currency: string;
};

export type EventInfo = {
  id: number;
  name: string;
  description: string;
  event_date: string;
  venue: string;
  capacity: number;
  booked_tickets: number;
  available_tickets: number;
  pricing: Pricing;
};

export type TicketType = "full" | "child";

export type BookingParticipant = {
  id: number;
  name: string;
  age: number;
  ticket_type: TicketType;
  ticket_price: number;
};

export type Booking = {
  id: number;
  event_id: number;
  contact_email: string;
  total_price: number;
  participant_count: number;
  status: string;
  created_at: string;
  participants: BookingParticipant[];
};

export type ApiErrorBody = {
  error: { code: string; message: string; details?: { field: string; message: string }[] };
};

export type ParticipantDraft = { key: string; name: string; age: string };
