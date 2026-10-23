import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update

from app.core.config import settings
from app.db.models import Event
from app.db.session import SessionLocal, engine

DEMO_NAME = "Summer in the Park City Festival"
DEMO_DESCRIPTION = (
    "Live music, workshops and family relaxation zones under the open sky. "
    "One day, three stages and a food court."
)
DEMO_VENUE = "Central Park, Great Lawn, New York, NY"


async def seed(booked: int | None = None) -> None:
    async with SessionLocal() as session, session.begin():
        event = await session.scalar(select(Event).order_by(Event.id).limit(1))
        if event is None:
            session.add(Event(
                name=DEMO_NAME,
                description=DEMO_DESCRIPTION,
                event_date=datetime.now(timezone.utc).replace(hour=22, minute=0, second=0, microsecond=0)
                + timedelta(days=30),
                venue=DEMO_VENUE,
                capacity=settings.demo_event_capacity,
                booked_tickets=booked or 0,
            ))
            print("Demo event created")
        else:
            event.name = DEMO_NAME
            event.description = DEMO_DESCRIPTION
            event.venue = DEMO_VENUE
            if booked is not None:
                await session.execute(
                    update(Event).where(Event.id == event.id).values(booked_tickets=min(booked, event.capacity))
                )
                print(f"Booked seats set to: {min(booked, event.capacity)}")
            else:
                print("Demo event already exists — details refreshed, capacity untouched")
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--set-booked", type=int, default=None, help="Set the number of booked seats (sold-out demo)")
    args = parser.parse_args()
    asyncio.run(seed(args.set_booked))
