from datetime import datetime

from pydantic import BaseModel


class PricingInfo(BaseModel):
    full_ticket_price: int
    child_ticket_price: int
    child_age_limit: int
    adult_age: int
    max_participants: int
    currency: str = "RUB"


class EventOut(BaseModel):
    id: int
    name: str
    description: str
    event_date: datetime
    venue: str
    capacity: int
    booked_tickets: int
    available_tickets: int
    pricing: PricingInfo
