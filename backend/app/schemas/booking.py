import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic import EmailStr, TypeAdapter

from app.services.pricing import MAX_AGE, MAX_PARTICIPANTS, MIN_AGE, MIN_PARTICIPANTS

_email_adapter = TypeAdapter(EmailStr)


class ParticipantIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    age: int = Field(ge=MIN_AGE, le=MAX_AGE)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v).strip()
        if not v:
            raise ValueError("Укажите имя участника")
        if len(v) > 200:
            raise ValueError("Имя слишком длинное")
        return v


class BookingCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event_id: int
    contact_email: str
    participants: list[ParticipantIn] = Field(min_length=MIN_PARTICIPANTS, max_length=MAX_PARTICIPANTS)

    @field_validator("contact_email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        try:
            return str(_email_adapter.validate_python(v.strip())).lower()
        except Exception:
            raise ValueError("Укажите корректный адрес электронной почты")


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    ticket_type: str
    ticket_price: int


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    contact_email: str
    total_price: int
    participant_count: int
    status: str
    created_at: datetime
    participants: list[ParticipantOut]


class ErrorBody(BaseModel):

    code: str
    message: str
    details: list[dict] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody
