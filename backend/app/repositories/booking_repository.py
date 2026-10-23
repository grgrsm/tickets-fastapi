from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Booking


async def get_booking(session: AsyncSession, booking_id: int) -> Booking | None:
    return await session.scalar(select(Booking).where(Booking.id == booking_id))
