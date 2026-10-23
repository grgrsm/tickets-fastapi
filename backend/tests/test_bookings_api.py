import asyncio

from sqlalchemy import text

from tests.conftest import EVENT_CAPACITY, count


def payload(event_id, participants=None, email="Anna@Example.com ", **extra):
    return {
        "event_id": event_id,
        "contact_email": email,
        "participants": [{"name": "Anna", "age": 30}] if participants is None else participants,
        **extra,
    }


async def test_single_adult_full_ticket(client, event_id):
    r = await client.post("/api/v1/bookings", json=payload(event_id))
    assert r.status_code == 201
    body = r.json()
    assert body["total_price"] == 2000
    assert body["participants"][0]["ticket_type"] == "full"
    assert body["contact_email"] == "anna@example.com"


async def test_mixed_total_and_retrieval(client, event_id):
    people = [{"name": " Anna  Lee ", "age": 40}, {"name": "Pete", "age": 13}, {"name": "Mary", "age": 14}]
    r = await client.post("/api/v1/bookings", json=payload(event_id, people))
    assert r.status_code == 201
    created = r.json()
    assert created["total_price"] == 2000 + 1000 + 2000
    assert created["participants"][0]["name"] == "Anna Lee"
    got = await client.get(f"/api/v1/bookings/{created['id']}")
    assert got.status_code == 200 and got.json() == created
    ev = (await client.get(f"/api/v1/events/{event_id}")).json()
    assert ev["booked_tickets"] == 3 and ev["available_tickets"] == EVENT_CAPACITY - 3


async def test_forged_prices_are_ignored(client, event_id):
    people = [{"name": "Anna", "age": 30, "ticket_price": 1, "ticket_type": "child"}]
    r = await client.post("/api/v1/bookings", json=payload(event_id, people, total_price=1, participant_count=9))
    assert r.status_code == 201
    assert r.json()["total_price"] == 2000
    assert r.json()["participants"][0]["ticket_type"] == "full"
    assert r.json()["participant_count"] == 1


async def test_child_without_adult_rejected(client, event_id, db):
    r = await client.post("/api/v1/bookings", json=payload(event_id, [{"name": "Pete", "age": 10}]))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "booking_rule_violation"
    assert await count(db, "bookings") == 0


async def test_child_with_adult_accepted(client, event_id):
    people = [{"name": "Pete", "age": 10}, {"name": "Anna", "age": 18}]
    assert (await client.post("/api/v1/bookings", json=payload(event_id, people))).status_code == 201


async def test_17_year_old_does_not_accompany(client, event_id):
    people = [{"name": "Pete", "age": 10}, {"name": "John", "age": 17}]
    assert (await client.post("/api/v1/bookings", json=payload(event_id, people))).status_code == 422


async def test_invalid_names(client, event_id):
    for name in ["", "   "]:
        r = await client.post("/api/v1/bookings", json=payload(event_id, [{"name": name, "age": 30}]))
        assert r.status_code == 422
        assert r.json()["error"]["code"] == "validation_error"


async def test_invalid_emails(client, event_id):
    for email in ["", "abc", "a@", "a b@c.com"]:
        r = await client.post("/api/v1/bookings", json=payload(event_id, email=email))
        assert r.status_code == 422, email


async def test_age_out_of_range(client, event_id):
    for age in [-1, 121]:
        r = await client.post("/api/v1/bookings", json=payload(event_id, [{"name": "A", "age": age}]))
        assert r.status_code == 422
    for age in [0, 120]:
        people = [{"name": "A", "age": age}, {"name": "B", "age": 30}]
        assert (await client.post("/api/v1/bookings", json=payload(event_id, people))).status_code == 201


async def test_participant_count_bounds(client, event_id):
    assert (await client.post("/api/v1/bookings", json=payload(event_id, []))).status_code == 422
    five = [{"name": f"P{i}", "age": 30} for i in range(5)]
    assert (await client.post("/api/v1/bookings", json=payload(event_id, five))).status_code == 422


async def test_unknown_event_and_booking(client, event_id):
    assert (await client.post("/api/v1/bookings", json=payload(9999))).status_code == 404
    assert (await client.get("/api/v1/bookings/9999")).status_code == 404
    assert (await client.get("/api/v1/events/9999")).status_code == 404


async def test_insufficient_capacity_leaves_no_partial_records(client, event_id, db):
    four = [{"name": f"P{i}", "age": 30} for i in range(4)]
    assert (await client.post("/api/v1/bookings", json=payload(event_id, four))).status_code == 201
    assert await count(db, "booking_participants") == 4
    two = [{"name": "A", "age": 30}, {"name": "B", "age": 30}]
    r = await client.post("/api/v1/bookings", json=payload(event_id, two))
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "insufficient_capacity"
    assert await count(db, "bookings") == 1
    assert await count(db, "booking_participants") == 4
    booked = (await db.execute(text("SELECT booked_tickets FROM events"))).scalar_one()
    assert booked == 4


async def test_concurrent_bookings_never_oversell(client, event_id, db):
    reqs = [client.post("/api/v1/bookings", json=payload(event_id)) for _ in range(8)]
    codes = sorted(r.status_code for r in await asyncio.gather(*reqs))
    assert codes == [201] * EVENT_CAPACITY + [409] * 3
    assert await count(db, "booking_participants") == EVENT_CAPACITY
    booked = (await db.execute(text("SELECT booked_tickets FROM events"))).scalar_one()
    assert booked == EVENT_CAPACITY
