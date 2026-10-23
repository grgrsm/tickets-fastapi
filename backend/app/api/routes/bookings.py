from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.exceptions import BookingNotFound
from app.repositories import booking_repository
from app.schemas.booking import BookingCreate, BookingOut, ErrorResponse
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post(
    "", response_model=BookingOut, status_code=201,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def create_booking(data: BookingCreate, session: AsyncSession = Depends(get_session)):
    return await booking_service.create_booking(session, data)


@router.get("/{booking_id}", response_model=BookingOut, responses={404: {"model": ErrorResponse}})
async def get_booking(booking_id: int, session: AsyncSession = Depends(get_session)):
    booking = await booking_repository.get_booking(session, booking_id)
    if booking is None:
        raise BookingNotFound("Бронирование не найдено")
    return booking
