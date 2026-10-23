import { Icon } from "@/components/ui/Icon";
import { classifyAge, formatRub, ticketLabel } from "@/lib/pricing";
import { parseAge, type ParticipantErrors } from "@/lib/validation";
import type { ParticipantDraft, Pricing } from "@/types/api";

type Props = {
  participants: ParticipantDraft[];
  pricing: Pricing;
  errors: ParticipantErrors[];
  formError?: string;
  maxParticipants: number;
  onChange: (key: string, patch: Partial<ParticipantDraft>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
};

export function ParticipantForm({ participants, pricing, errors, formError, maxParticipants, onChange, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-4">
      {participants.map((p, i) => {
        const err = errors[i] ?? {};
        const age = parseAge(p.age);
        const ticket = age !== null && age <= 120 ? classifyAge(age, pricing) : null;
        return (
          <fieldset key={p.key} className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon name="user" className="h-6 w-6 text-accent-deep" />
                <legend className="float-left text-lg font-semibold">Участник {i + 1}</legend>
              </div>
              {participants.length > 1 && (
                <button type="button" onClick={() => onRemove(p.key)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5 hover:text-ink">
                  <Icon name="trash" className="h-4 w-4" />Удалить<span className="sr-only"> участника {i + 1}</span>
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_9rem]">
              <div>
                <label className="label" htmlFor={`name-${p.key}`}>Имя</label>
                <input id={`name-${p.key}`} className="field" autoComplete="off" value={p.name}
                  aria-invalid={!!err.name} aria-describedby={err.name ? `name-err-${p.key}` : undefined}
                  onChange={(e) => onChange(p.key, { name: e.target.value })} placeholder="Например, Анна" />
                {err.name && <p id={`name-err-${p.key}`} className="error-text">{err.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor={`age-${p.key}`}>Возраст</label>
                <input id={`age-${p.key}`} className="field" inputMode="numeric" value={p.age}
                  aria-invalid={!!err.age} aria-describedby={err.age ? `age-err-${p.key}` : undefined}
                  onChange={(e) => onChange(p.key, { age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="Лет" />
                {err.age && <p id={`age-err-${p.key}`} className="error-text">{err.age}</p>}
              </div>
            </div>
            <p className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-3.5 py-2.5 text-sm" aria-live="polite">
              <span className="flex items-center gap-2 text-ink-soft">
                <Icon name="ticket" className="h-4 w-4 text-accent-deep" />
                {ticket ? ticketLabel[ticket.type] : "Билет определится по возрасту"}
              </span>
              {ticket && <span className="font-semibold">{formatRub(ticket.price)}</span>}
            </p>
          </fieldset>
        );
      })}

      <p className="flex gap-3 rounded-lg border border-accent/40 px-4 py-3 text-sm text-ink-soft">
        <Icon name="info" className="mt-0.5 h-4 w-4 text-accent-deep" />
        <span>Детский билет — для участников младше {pricing.child_age_limit} лет. Ребёнок допускается только вместе
        с участником от {pricing.adult_age} лет в том же заказе.</span>
      </p>
      {formError && (
        <p role="alert" className="flex gap-3 rounded-lg border border-red-700/40 bg-red-50 px-4 py-3 text-sm text-red-900">
          <Icon name="alert" className="mt-0.5 h-4 w-4" /><span>{formError}</span>
        </p>
      )}

      <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onAdd} disabled={participants.length >= maxParticipants}>
        <Icon name="plus" className="h-4 w-4" />Добавить участника
      </button>
      {participants.length >= maxParticipants && (
        <p className="text-sm text-ink-soft">В одном заказе — не больше {maxParticipants} участников.</p>
      )}
    </div>
  );
}
