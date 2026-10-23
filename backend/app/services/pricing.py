from dataclasses import dataclass

FULL_TICKET_PRICE = 2000
CHILD_TICKET_PRICE = 1000
CHILD_AGE_LIMIT = 14
ADULT_AGE = 18
MIN_PARTICIPANTS = 1
MAX_PARTICIPANTS = 4
MIN_AGE = 0
MAX_AGE = 120

FULL = "full"
CHILD = "child"


@dataclass(frozen=True)
class PricedTicket:
    ticket_type: str
    price: int


def classify(age: int) -> PricedTicket:
    if age < CHILD_AGE_LIMIT:
        return PricedTicket(CHILD, CHILD_TICKET_PRICE)
    return PricedTicket(FULL, FULL_TICKET_PRICE)


def has_required_adult(ages: list[int]) -> bool:
    if not any(a < CHILD_AGE_LIMIT for a in ages):
        return True
    return any(a >= ADULT_AGE for a in ages)
