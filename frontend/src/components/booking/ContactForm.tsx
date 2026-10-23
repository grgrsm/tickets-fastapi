import { Icon } from "@/components/ui/Icon";

type Props = { email: string; error?: string; onChange: (v: string) => void };

export function ContactForm({ email, error, onChange }: Props) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-3">
        <Icon name="mail" className="h-6 w-6 text-accent-deep" />
        <h2 className="text-lg font-semibold">Контакты для заказа</h2>
      </div>
      <label className="label" htmlFor="contact-email">Электронная почта</label>
      <input id="contact-email" type="email" inputMode="email" autoComplete="email" className="field"
        value={email} onChange={(e) => onChange(e.target.value)} placeholder="name@example.com"
        aria-invalid={!!error} aria-describedby={error ? "email-err" : "email-hint"} />
      {error ? <p id="email-err" className="error-text">{error}</p>
        : <p id="email-hint" className="mt-1.5 text-sm text-ink-soft">Один адрес на весь заказ. Письма мы не отправляем — адрес нужен для брони.</p>}
    </div>
  );
}
