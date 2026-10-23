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
    if (!d.name.trim()) e.name = "Enter the participant's name";
    const age = parseAge(d.age);
    if (d.age.trim() === "") e.age = "Enter the age";
    else if (age === null || age < MIN_AGE || age > MAX_AGE) e.age = `Age must be a number from ${MIN_AGE} to ${MAX_AGE}`;
    return e;
  });
  const ages = list.map((d) => parseAge(d.age)).filter((a): a is number => a !== null);
  const hasChild = ages.some((a) => a < p.child_age_limit);
  const hasAdult = ages.some((a) => a >= p.adult_age);
  const form = hasChild && !hasAdult
    ? `Children under ${p.child_age_limit} can attend only with a participant aged ${p.adult_age}+. Add an adult.`
    : undefined;
  const ok = fields.every((e) => !e.name && !e.age) && !form;
  return { fields, form, ok };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Enter an email address";
  if (!EMAIL_RE.test(email.trim())) return "Check the address: it should look like name@example.com";
  return undefined;
}
