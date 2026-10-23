"use client";

import { useRef, useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { ApiError, createBooking, getEvent } from "@/lib/api";
import { formatRub } from "@/lib/pricing";
import { parseAge, validateEmail, validateParticipants } from "@/lib/validation";
import type { Booking, EventInfo, ParticipantDraft } from "@/types/api";
import { BookingResult } from "./BookingResult";
import { ContactForm } from "./ContactForm";
import { OrderSummary } from "./OrderSummary";
import { ParticipantForm } from "./ParticipantForm";

type Step = "participants" | "contact" | "review" | "result";
type SubmitError = { kind: "capacity" | "other"; message: string };

const STEPS: { id: Exclude<Step, "result">; title: string; icon: IconName }[] = [
  { id: "participants", title: "Participants", icon: "users" },
  { id: "contact", title: "Contacts", icon: "mail" },
  { id: "review", title: "Review", icon: "check" },
];

const newParticipant = (): ParticipantDraft => ({ key: crypto.randomUUID(), name: "", age: "" });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short",
  });
}

export function BookingFlow({ initialEvent }: { initialEvent: EventInfo }) {
  const [event, setEvent] = useState(initialEvent);
  const [step, setStep] = useState<Step>("participants");
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() => [{ key: "p-initial", name: "", age: "" }]);
  const [email, setEmail] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const inFlight = useRef(false);

  const { pricing } = event;
  const pCheck = validateParticipants(participants, pricing);
  const emailError = validateEmail(email);
  const soldOut = event.available_tickets <= 0;

  const goNext = () => {
    setShowErrors(true);
    if (step === "participants" && pCheck.ok) { setStep("contact"); setShowErrors(false); }
    else if (step === "contact" && !emailError) { setStep("review"); setShowErrors(false); }
  };

  const submit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createBooking({
        event_id: event.id,
        contact_email: email,
        participants: participants.map((p) => ({ name: p.name, age: parseAge(p.age) ?? 0 })),
      });
      setBooking(result);
      setStep("result");
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.status === 409) {
        setSubmitError({ kind: "capacity", message: err.message });
        getEvent(event.id).then(setEvent).catch(() => undefined);
      } else if (err?.status === 422 && err.details.length) {
        setSubmitError({ kind: "other", message: err.details.map((d) => d.message).join(" ") });
      } else {
        setSubmitError({ kind: "other", message: err?.message ?? "Could not submit the order. Please try again." });
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const reset = () => {
    setParticipants([newParticipant()]); setEmail(""); setBooking(null); setSubmitError(null);
    setShowErrors(false); setStep("participants");
    getEvent(event.id).then(setEvent).catch(() => undefined);
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const total = participants.reduce((s, p) => {
    const a = parseAge(p.age);
    return s + (a === null ? 0 : a < pricing.child_age_limit ? pricing.child_ticket_price : pricing.full_ticket_price);
  }, 0);

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: "calendar", label: "Date and time", value: formatDate(event.event_date) },
    { icon: "pin", label: "Venue", value: event.venue },
    { icon: "ticket", label: "Seats left", value: soldOut ? "None" : String(event.available_tickets) },
    { icon: "wallet", label: "Ticket price", value: `${pricing.child_ticket_price.toLocaleString("en-US")}–${formatRub(pricing.full_ticket_price)}`.replace(/\u00a0/g, " ") },
  ];

  return (
    <div>
      <div className="on-accent hero-gradient pb-10 text-surface sm:pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <header className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2.5 text-xl font-bold">
              <Icon name="ticket" className="h-8 w-8" />
              Tickets
            </div>
            <ul className="hidden items-center gap-6 text-sm font-semibold sm:flex">
              <li className="flex items-center gap-2"><Icon name="userCheck" className="h-4 w-4" />No sign-up</li>
              <li className="flex items-center gap-2"><Icon name="zap" className="h-4 w-4" />Instant booking</li>
            </ul>
          </header>

          <div className="pb-8 pt-8 sm:pt-12">
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{event.name}</h1>
            <p className="mt-4 max-w-2xl text-base font-medium sm:text-lg">{event.description}</p>
          </div>

          {step !== "result" && (
            <nav aria-label="Booking steps" className="mb-4 w-full rounded-xl bg-surface/15 p-1 sm:inline-block sm:w-auto">
              <ol className="grid grid-cols-3 gap-1 sm:flex">
                {STEPS.map((s, i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <li key={s.id} aria-current={active ? "step" : undefined}>
                      <button type="button" disabled={!done || submitting}
                        onClick={() => { setStep(s.id); setShowErrors(false); setSubmitError(null); }}
                        className={`flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg px-1.5 text-[13px] font-semibold sm:gap-2 sm:px-5 sm:text-sm ${active ? "bg-surface text-ink" : "text-surface hover:bg-surface/15 disabled:hover:bg-transparent"} ${!active && !done ? "opacity-75" : ""}`}>
                        <Icon name={done ? "check" : s.icon} className="h-4 w-4" />{s.title}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <dl className="grid overflow-hidden rounded-xl bg-surface text-ink sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-3 border-b border-ink/10 px-4 py-3.5 last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0">
                <Icon name={f.icon} className="h-6 w-6 text-accent-deep" />
                <div className="min-w-0">
                  <dt className="text-xs text-ink-soft">{f.label}</dt>
                  <dd className="break-words text-sm font-semibold">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {step === "result" && booking ? (
          <div className="max-w-2xl"><BookingResult booking={booking} onNew={reset} /></div>
        ) : soldOut && !submitError ? (
          <div className="card flex max-w-2xl gap-3" role="status">
            <Icon name="alert" className="mt-1 h-5 w-5 text-accent-deep" />
            <div>
              <h2 className="text-xl font-semibold">Sold out</h2>
              <p className="mt-2 text-ink-soft">All seats for this event are taken.</p>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0 space-y-4">
              {step === "participants" && (
                <ParticipantForm participants={participants} pricing={pricing} maxParticipants={pricing.max_participants}
                  errors={showErrors ? pCheck.fields : []} formError={showErrors || pCheck.form ? pCheck.form : undefined}
                  onChange={(key, patch) => setParticipants((l) => l.map((p) => (p.key === key ? { ...p, ...patch } : p)))}
                  onAdd={() => setParticipants((l) => [...l, newParticipant()])}
                  onRemove={(key) => setParticipants((l) => l.filter((p) => p.key !== key))} />
              )}
              {step === "contact" && <ContactForm email={email} error={showErrors ? emailError : undefined} onChange={setEmail} />}
              {step === "review" && (
                <>
                  <OrderSummary participants={participants} pricing={pricing} email={email} heading="Review your order" />
                  {submitError && (
                    <div role="alert" className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${submitError.kind === "capacity" ? "border-accent bg-surface text-ink" : "border-red-700/40 bg-red-50 text-red-900"}`}>
                      <Icon name="alert" className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-semibold">{submitError.kind === "capacity" ? "Not enough seats" : "Order not created"}</p>
                        <p className="mt-1">{submitError.message}</p>
                        {submitError.kind === "capacity" && (
                          <p className="mt-1">Seats available now: {event.available_tickets}. Go back and edit your order.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                {stepIndex > 0 ? (
                  <button type="button" className="btn-ghost" disabled={submitting}
                    onClick={() => { setStep(STEPS[stepIndex - 1]!.id); setShowErrors(false); setSubmitError(null); }}>
                    <Icon name="arrowLeft" className="h-4 w-4" />Back
                  </button>
                ) : <span />}
                {step === "review" ? (
                  <button type="button" className="btn-primary" onClick={submit} disabled={submitting} aria-busy={submitting}>
                    <Icon name="check" className="h-5 w-5" />
                    {submitting ? "Submitting…" : `Confirm and book · ${formatRub(total)}`}
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={goNext}>Next<Icon name="arrowRight" className="h-4 w-4" /></button>
                )}
              </div>
            </div>

            {step !== "review" && (
              <aside className="min-w-0 lg:sticky lg:top-6">
                <OrderSummary participants={participants} pricing={pricing} />
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
