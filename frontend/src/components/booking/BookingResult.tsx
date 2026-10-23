import { Icon } from "@/components/ui/Icon";
import { formatRub, pluralParticipants, ticketLabel } from "@/lib/pricing";
import type { Booking } from "@/types/api";

export function BookingResult({ booking, onNew }: { booking: Booking; onNew: () => void }) {
  return (
    <div className="space-y-4">
      <div className="card flex gap-4 border-accent/50" role="status">
        <Icon name="check" className="mt-0.5 h-9 w-9 text-accent-deep" />
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">Booking confirmed</h2>
          <p className="mt-2 text-ink-soft">Booking number</p>
          <p className="text-3xl font-bold tracking-tight text-accent-deep">#{booking.id}</p>
          <p className="mt-2 flex items-center gap-2 break-all text-sm text-ink-soft"><Icon name="mail" className="h-4 w-4" />{booking.contact_email}</p>
        </div>
      </div>
      <section className="card" aria-label="Order details">
        <ul className="divide-y divide-ink/10">
          {booking.participants.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="break-words font-medium">{p.name}<span className="font-normal text-ink-soft">, {p.age}</span></p>
                <p className="text-sm text-ink-soft">{ticketLabel[p.ticket_type]}</p>
              </div>
              <p className="shrink-0 font-medium">{formatRub(p.ticket_price)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-4">
          <p className="text-sm text-ink-soft">{pluralParticipants(booking.participant_count)}</p>
          <p className="text-sm text-ink-soft">Total <span className="ml-2 text-2xl font-bold text-ink">{formatRub(booking.total_price)}</span></p>
        </div>
      </section>
      <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onNew}><Icon name="plus" className="h-4 w-4" />Book again</button>
    </div>
  );
}
