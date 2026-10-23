import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update

from app.core.config import settings
from app.db.models import Event
from app.db.session import SessionLocal, engine

DEMO_NAME = "Городской фестиваль «Лето в парке»"


async def seed(booked: int | None = None) -> None:
    async with SessionLocal() as session, session.begin():
        event = await session.scalar(select(Event).where(Event.name == DEMO_NAME))
        if event is None:
            session.add(Event(
                name=DEMO_NAME,
                description="Живая музыка, мастер-классы и семейные зоны отдыха под открытым небом. "
                            "Один день, три сцены и фуд-корт.",
                event_date=datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
                + timedelta(days=30),
                venue="Центральный парк, главная поляна",
                capacity=settings.demo_event_capacity,
                booked_tickets=booked or 0,
            ))
            print("Демо-событие создано")
        elif booked is not None:
            await session.execute(
                update(Event).where(Event.id == event.id).values(booked_tickets=min(booked, event.capacity))
            )
            print(f"Занято мест установлено: {min(booked, event.capacity)}")
        else:
            print("Демо-событие уже существует — ничего не изменено")
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--set-booked", type=int, default=None, help="Задать число занятых мест (демо «распродано»)")
    args = parser.parse_args()
    asyncio.run(seed(args.set_booked))
