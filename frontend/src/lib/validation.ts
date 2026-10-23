import type { ParticipantDraft, Pricing } from "@/types/api";

export const MIN_AGE = 0;
export const MAX_AGE = 120;

export type ParticipantErrors = { name?: string; age?: string };

export function parseAge(raw: string): number | null {
  return /^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : null;
}

export function validateParticipants(list: ParticipantDraft[], p: Pricing) {
  const fields: ParticipantErrors[] = list.map((d) => {
    const e: ParticipantErrors = {};
    if (!d.name.trim()) e.name = "Укажите имя участника";
    const age = parseAge(d.age);
    if (d.age.trim() === "") e.age = "Укажите возраст";
    else if (age === null || age < MIN_AGE || age > MAX_AGE) e.age = `Возраст — число от ${MIN_AGE} до ${MAX_AGE}`;
    return e;
  });
  const ages = list.map((d) => parseAge(d.age)).filter((a): a is number => a !== null);
  const hasChild = ages.some((a) => a < p.child_age_limit);
  const hasAdult = ages.some((a) => a >= p.adult_age);
  const form = hasChild && !hasAdult
    ? `Дети младше ${p.child_age_limit} лет допускаются только в сопровождении участника ${p.adult_age}+. Добавьте взрослого.`
    : undefined;
  const ok = fields.every((e) => !e.name && !e.age) && !form;
  return { fields, form, ok };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Укажите адрес электронной почты";
  if (!EMAIL_RE.test(email.trim())) return "Проверьте адрес: он должен выглядеть как name@example.com";
  return undefined;
}
