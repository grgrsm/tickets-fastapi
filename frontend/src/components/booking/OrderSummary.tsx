import { Icon } from "@/components/ui/Icon";
import { classifyAge, formatRub, pluralParticipants, ticketLabel } from "@/lib/pricing";
import { parseAge } from "@/lib/validation";
import type { ParticipantDraft, Pricing } from "@/types/api";

type Props = { participants: ParticipantDraft[]; pricing: Pricing; email?: string; heading?: string };

export function OrderSummary({ participants, pricing, email, heading = "Ваш заказ" }: Props) {
  const rows = participants.map((p, i) => {
    const age = parseAge(p.age);
    return { key: p.key, name: p.name.trim() || `Участник ${i + 1}`, age, ticket: age !== null ? classifyAge(age, pricing) : null };
  });
  const total = rows.reduce((s, r) => s + (r.ticket?.price ?? 0), 0);

  return (
    <section className="overflow-hidden rounded-xl border border-ink/10 bg-surface" aria-label={heading}>
      <h2 className="on-accent accent-gradient flex items-center gap-2.5 px-5 py-3.5 text-lg font-semibold text-surface">
        <Icon name="receipt" />{heading}
      </h2>
      <div className="p-5">
        <ul className="divide-y divide-ink/10">
          {rows.map((r) => (
            <li key={r.key} className="flex items-start justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="break-words font-medium">{r.name}{r.age !== null && <span className="font-normal text-ink-soft">, {r.age}</span>}</p>
                <p className="text-sm text-ink-soft">{r.ticket ? ticketLabel[r.ticket.type] : "—"}</p>
              </div>
              <p className="shrink-0 font-medium">{r.ticket ? formatRub(r.ticket.price) : "—"}</p>
            </li>
          ))}
        </ul>
        {email && (
          <p className="flex items-center gap-2 break-all border-t border-ink/10 py-3 text-sm text-ink-soft">
            <Icon name="mail" className="h-4 w-4" />{email.trim()}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-4">
          <p className="text-sm text-ink-soft">{pluralParticipants(rows.length)}</p>
          <p className="text-sm text-ink-soft">Итого <span className="ml-2 text-2xl font-bold text-ink">{formatRub(total)}</span></p>
        </div>
      </div>
    </section>
  );
}
