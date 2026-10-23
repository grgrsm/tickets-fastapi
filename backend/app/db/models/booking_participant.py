from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base


class BookingParticipant(Base):
    __tablename__ = "booking_participants"
    __table_args__ = (
        CheckConstraint("age BETWEEN 0 AND 120", name="ck_participants_age"),
        CheckConstraint("ticket_type IN ('full', 'child')", name="ck_participants_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    age: Mapped[int] = mapped_column(Integer)
    ticket_type: Mapped[str] = mapped_column(String(10))
    ticket_price: Mapped[int] = mapped_column(Integer)

    booking = relationship("Booking", back_populates="participants")
