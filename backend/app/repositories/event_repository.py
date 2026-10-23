from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Event


async def list_events(session: AsyncSession) -> list[Event]:
    return list((await session.scalars(select(Event).order_by(Event.event_date))).all())


async def get_event(session: AsyncSession, event_id: int) -> Event | None:
    return await session.get(Event, event_id)


async def get_event_for_update(session: AsyncSession, event_id: int) -> Event | None:
    stmt = select(Event).where(Event.id == event_id).with_for_update()
    return await session.scalar(stmt)
