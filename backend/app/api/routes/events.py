from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Event
from app.db.session import get_session
from app.exceptions import EventNotFound
from app.repositories import event_repository
from app.schemas.booking import ErrorResponse
from app.schemas.event import EventOut, PricingInfo
from app.services import pricing

router = APIRouter(prefix="/events", tags=["events"])


def to_event_out(e: Event) -> EventOut:
    return EventOut(
        id=e.id, name=e.name, description=e.description, event_date=e.event_date, venue=e.venue,
        capacity=e.capacity, booked_tickets=e.booked_tickets,
        available_tickets=e.capacity - e.booked_tickets,
        pricing=PricingInfo(
            full_ticket_price=pricing.FULL_TICKET_PRICE, child_ticket_price=pricing.CHILD_TICKET_PRICE,
            child_age_limit=pricing.CHILD_AGE_LIMIT, adult_age=pricing.ADULT_AGE,
            max_participants=pricing.MAX_PARTICIPANTS,
        ),
    )


@router.get("", response_model=list[EventOut])
async def list_events(session: AsyncSession = Depends(get_session)):
    return [to_event_out(e) for e in await event_repository.list_events(session)]


@router.get("/{event_id}", response_model=EventOut, responses={404: {"model": ErrorResponse}})
async def get_event(event_id: int, session: AsyncSession = Depends(get_session)):
    event = await event_repository.get_event(session, event_id)
    if event is None:
        raise EventNotFound("Event not found")
    return to_event_out(event)
