from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Booking, BookingParticipant
from app.exceptions import BookingRuleViolation, EventNotFound, InsufficientCapacity
from app.repositories import event_repository
from app.schemas.booking import BookingCreate
from app.services import pricing


def validate_participants(ages: list[int]) -> None:
    if not pricing.MIN_PARTICIPANTS <= len(ages) <= pricing.MAX_PARTICIPANTS:
        raise BookingRuleViolation(
            f"В заказе должно быть от {pricing.MIN_PARTICIPANTS} до {pricing.MAX_PARTICIPANTS} участников"
        )
    if not pricing.has_required_adult(ages):
        raise BookingRuleViolation(
            f"Дети младше {pricing.CHILD_AGE_LIMIT} лет допускаются только в сопровождении участника "
            f"старше {pricing.ADULT_AGE - 1} лет"
        )


async def create_booking(session: AsyncSession, data: BookingCreate) -> Booking:
    validate_participants([p.age for p in data.participants])
    priced = [pricing.classify(p.age) for p in data.participants]
    total = sum(t.price for t in priced)
    count = len(data.participants)

    async with session.begin():
        event = await event_repository.get_event_for_update(session, data.event_id)
        if event is None:
            raise EventNotFound("Событие не найдено")
        if event.capacity - event.booked_tickets < count:
            raise InsufficientCapacity(
                "К сожалению, свободных мест больше нет. Ваши данные сохранены — "
                "уменьшите количество участников или попробуйте позже."
            )
        booking = Booking(
            event_id=event.id,
            contact_email=data.contact_email,
            total_price=total,
            participant_count=count,
            status="confirmed",
            participants=[
                BookingParticipant(name=p.name, age=p.age, ticket_type=t.ticket_type, ticket_price=t.price)
                for p, t in zip(data.participants, priced)
            ],
        )
        session.add(booking)
        event.booked_tickets += count
        await session.flush()
    return booking
