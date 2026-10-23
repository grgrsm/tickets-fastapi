from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("participant_count BETWEEN 1 AND 4", name="ck_bookings_participants"),
        CheckConstraint("total_price >= 0", name="ck_bookings_total"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    contact_email: Mapped[str] = mapped_column(String(320))
    total_price: Mapped[int] = mapped_column(Integer)
    participant_count: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participants: Mapped[list["BookingParticipant"]] = relationship(
        back_populates="booking", order_by="BookingParticipant.id", lazy="selectin"
    )
