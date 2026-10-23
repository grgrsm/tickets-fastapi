import { BookingFlow } from "@/components/booking/BookingFlow";
import { getEvents } from "@/lib/api";
import type { EventInfo } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function Page() {
  let event: EventInfo | null = null;
  let failed = false;
  try {
    event = (await getEvents())[0] ?? null;
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div role="alert" className="card">
          <h1 className="text-xl font-semibold">Не удалось загрузить мероприятие</h1>
          <p className="mt-2 text-ink-soft">Сервер бронирования недоступен. Обновите страницу через минуту.</p>
        </div>
      </main>
    );
  }
  if (!event) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="card">
          <h1 className="text-xl font-semibold">Пока нет мероприятий</h1>
          <p className="mt-2 text-ink-soft">Билеты появятся здесь, как только организаторы опубликуют событие.</p>
        </div>
      </main>
    );
  }
  return <BookingFlow initialEvent={event} />;
}
