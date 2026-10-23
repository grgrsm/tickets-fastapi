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
          <h1 className="text-xl font-semibold">Could not load the event</h1>
          <p className="mt-2 text-ink-soft">The booking server is unavailable. Please refresh the page in a minute.</p>
        </div>
      </main>
    );
  }
  if (!event) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="card">
          <h1 className="text-xl font-semibold">No events yet</h1>
          <p className="mt-2 text-ink-soft">Tickets will appear here as soon as organizers publish an event.</p>
        </div>
      </main>
    );
  }
  return <BookingFlow initialEvent={event} />;
}
