import os
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.models import Base, Event
from app.db.session import get_session
from app.main import app

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://tickets:tickets@localhost:5432/tickets_test"
)
assert TEST_DB_URL.rsplit("/", 1)[-1].endswith("_test"), "TEST_DATABASE_URL должен указывать на базу *_test"

EVENT_CAPACITY = 5


@pytest.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest.fixture
def sessionmaker(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def event_id(sessionmaker) -> int:
    async with sessionmaker() as s, s.begin():
        e = Event(name="Тест", description="d", event_date=datetime.now(timezone.utc), venue="v",
                  capacity=EVENT_CAPACITY, booked_tickets=0)
        s.add(e)
        await s.flush()
        return e.id


@pytest.fixture
async def client(sessionmaker):
    async def override():
        async with sessionmaker() as s:
            yield s

    app.dependency_overrides[get_session] = override
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def db(sessionmaker):
    async with sessionmaker() as s:
        yield s


async def count(db, table: str) -> int:
    return (await db.execute(text(f"SELECT count(*) FROM {table}"))).scalar_one()
